import { Router } from "express";
import type { PrismaClient } from "@prisma/client";
import type { AppEnv } from "../../core/config/env.js";
import { type AuditLogger } from "../../core/audit/auditService.js";
import { canTransitionJobStatus } from "../../core/jobs/jobLifecycle.js";
import type { JobRecord } from "../../core/jobs/jobRepository.js";
import { jobPatchSchema, jobStatusUpdateSchema, manualJobCreateSchema } from "../../core/jobs/jobSchemas.js";
import type { JobStatus } from "../../core/jobs/jobTypes.js";
import { auditActor, requirePermission } from "../../core/security/adminAuth.js";
import { idParamSchema } from "../../core/validation/common.js";
import { PrismaJobRepository } from "../repositories/prismaJobRepository.js";
import { TwilioOutboundMessenger } from "../services/twilioOutboundMessenger.js";

function parseOptionalDate(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value.trim() === "") {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function serializeJob(job: JobRecord) {
  return {
    ...job,
    preferred_date: job.preferred_date?.toISOString() ?? null,
    scheduled_start: job.scheduled_start?.toISOString() ?? null,
    scheduled_end: job.scheduled_end?.toISOString() ?? null,
    completed_at: job.completed_at?.toISOString() ?? null,
    created_at: job.created_at.toISOString(),
    updated_at: job.updated_at.toISOString()
  };
}

function formatConfirmationDate(job: JobRecord) {
  if (job.scheduled_start) {
    return new Intl.DateTimeFormat("en-GB", { dateStyle: "full" }).format(job.scheduled_start);
  }
  if (job.preferred_date) {
    return new Intl.DateTimeFormat("en-GB", { dateStyle: "full" }).format(job.preferred_date);
  }
  return "To be confirmed";
}

function formatConfirmationTime(job: JobRecord) {
  if (job.scheduled_start) {
    return new Intl.DateTimeFormat("en-GB", { timeStyle: "short" }).format(job.scheduled_start);
  }
  return job.preferred_time_text ?? "To be confirmed";
}

async function sendCustomerJobMessage(
  prisma: PrismaClient,
  env: AppEnv,
  job: JobRecord,
  body: string
) {
  if (job.source !== "whatsapp" || !job.customer_phone || job.customer_phone.startsWith("manual:")) {
    return;
  }

  const messenger = new TwilioOutboundMessenger(env);
  const outbound = await messenger.sendWhatsAppMessage(job.customer_phone, body);

  if (job.conversation_id) {
    await prisma.conversationMessage.create({
      data: {
        conversation_id: job.conversation_id,
        customer_id: job.customer_id,
        direction: "outbound",
        provider: "twilio",
        provider_message_id: outbound.providerMessageId,
        body,
        message_type: "text"
      }
    });
  }
}

function confirmationMessage(job: JobRecord) {
  return `Your mobile tyre service has been confirmed.

Date: ${formatConfirmationDate(job)}
Time: ${formatConfirmationTime(job)}
Vehicle: ${job.vehicle_registration ?? "Not recorded"}
Reference: ${job.job_reference}

Reply HELP if anything changes.`;
}

function cancellationMessage() {
  return "Sorry, Rugby Tyre Services cannot confirm this request at the moment. Please call the shop or reply HELP if you need assistance.";
}

function rescheduleMessage(job: JobRecord) {
  return `Your job has been rescheduled.

New date: ${formatConfirmationDate(job)}
New time: ${formatConfirmationTime(job)}
Vehicle: ${job.vehicle_registration ?? "Not recorded"}
Reference: ${job.job_reference}`;
}

export function createDashboardJobRoutes(env: AppEnv, prisma: PrismaClient, auditLogger: AuditLogger) {
  const router = Router();
  const jobRepository = new PrismaJobRepository(prisma);

  router.get("/", async (_req, res, next) => {
    try {
      const jobs = await jobRepository.listJobs();
      res.json(jobs.map(serializeJob));
    } catch (error) {
      next(error);
    }
  });

  router.post("/", requirePermission("jobs:write"), async (req, res, next) => {
    try {
      const parsed = manualJobCreateSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
      }

      const job = await jobRepository.createJob({
        ...parsed.data,
        preferred_date: parseOptionalDate(parsed.data.preferred_date) ?? null,
        completed_at: parseOptionalDate(parsed.data.completed_at) ?? null,
        payment_status: parsed.data.payment_status
      });

      await auditLogger.log({
        ...auditActor(req),
        action: "job.created_manual",
        entity_type: "job",
        entity_id: job.id,
        metadata: { job_reference: job.job_reference, source: job.source }
      });

      res.status(201).json(serializeJob(job));
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id", async (req, res, next) => {
    try {
      const params = idParamSchema.safeParse(req.params);
      if (!params.success) {
        res.status(400).json({ error: "Invalid job id" });
        return;
      }

      const job = await jobRepository.getJob(params.data.id);
      if (!job) {
        res.status(404).json({ error: "Job not found" });
        return;
      }

      res.json(serializeJob(job));
    } catch (error) {
      next(error);
    }
  });

  router.patch("/:id", requirePermission("jobs:write"), async (req, res, next) => {
    try {
      const params = idParamSchema.safeParse(req.params);
      const parsed = jobPatchSchema.safeParse(req.body);
      if (!params.success || !parsed.success) {
        res.status(400).json({ error: "Invalid job update" });
        return;
      }

      const existing = await jobRepository.getJob(params.data.id);
      if (!existing) {
        res.status(404).json({ error: "Job not found" });
        return;
      }

      if (parsed.data.customer_name || parsed.data.phone) {
        await prisma.customer.update({
          where: { id: existing.customer_id },
          data: {
            name: parsed.data.customer_name || undefined,
            phone: parsed.data.phone || undefined,
            last_seen_at: new Date()
          }
        });
      }

      const job = await jobRepository.updateJob(params.data.id, {
        ...parsed.data,
        preferred_date: parseOptionalDate(parsed.data.preferred_date),
        completed_at: parseOptionalDate(parsed.data.completed_at),
        customer_name: undefined,
        phone: undefined
      });

      await auditLogger.log({
        ...auditActor(req),
        action: "job.updated",
        entity_type: "job",
        entity_id: job.id,
        metadata: { job_reference: job.job_reference }
      });

      res.json(serializeJob(job));
    } catch (error) {
      next(error);
    }
  });

  router.patch("/:id/status", requirePermission("jobs:write"), async (req, res, next) => {
    try {
      const params = idParamSchema.safeParse(req.params);
      const parsed = jobStatusUpdateSchema.safeParse(req.body);
      if (!params.success || !parsed.success) {
        res.status(400).json({ error: "Invalid job status update" });
        return;
      }

      const existing = await jobRepository.getJob(params.data.id);
      if (!existing) {
        res.status(404).json({ error: "Job not found" });
        return;
      }

      if (!canTransitionJobStatus(existing.status as JobStatus, parsed.data.status)) {
        res.status(409).json({ error: `Cannot move job from ${existing.status} to ${parsed.data.status}` });
        return;
      }

      const job = await jobRepository.updateJobStatus(params.data.id, parsed.data.status, {
        payment_status: parsed.data.payment_status,
        payment_method: parsed.data.payment_method,
        preferred_date: parseOptionalDate(parsed.data.preferred_date),
        preferred_time_text: parsed.data.preferred_time_text,
        scheduled_start: parseOptionalDate(parsed.data.scheduled_start),
        scheduled_end: parseOptionalDate(parsed.data.scheduled_end),
        cancellation_reason: parsed.data.cancellation_reason,
        reschedule_requested_text: parsed.data.reschedule_requested_text
      });

      if (parsed.data.status === "confirmed" || parsed.data.status === "scheduled") {
        await sendCustomerJobMessage(prisma, env, job, confirmationMessage(job));
      }
      if (parsed.data.status === "cancelled") {
        await sendCustomerJobMessage(prisma, env, job, cancellationMessage());
      }
      if (parsed.data.status === "rescheduled") {
        await sendCustomerJobMessage(prisma, env, job, rescheduleMessage(job));
      }

      await auditLogger.log({
        ...auditActor(req),
        action: "job.status_updated",
        entity_type: "job",
        entity_id: job.id,
        metadata: {
          job_reference: job.job_reference,
          from: existing.status,
          to: job.status
        }
      });

      if (parsed.data.payment_status && parsed.data.payment_status !== existing.payment_status) {
        await auditLogger.log({
          ...auditActor(req),
          action: "payment.status_updated",
          entity_type: "job",
          entity_id: job.id,
          metadata: {
            job_reference: job.job_reference,
            from: existing.payment_status,
            to: parsed.data.payment_status
          }
        });
      }

      res.json(serializeJob(job));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
