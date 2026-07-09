import { Prisma, type PrismaClient } from "@prisma/client";
import { createJobReference } from "../../core/jobs/jobReference.js";
import type { CreateJobInput, JobRecord } from "../../core/jobs/jobRepository.js";
import { activeJobStatuses, type JobStatus } from "../../core/jobs/jobTypes.js";
import { normalizeWhatsAppAddress } from "../../core/messages/safeLogging.js";

function decimalToNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  return Number(value);
}

function toJobRecord(job: {
  id: string;
  job_reference: string;
  customer_id: string;
  conversation_id: string | null;
  assigned_user_id: string | null;
  vehicle_registration: string | null;
  tyre_size: string | null;
  tyre_description: string | null;
  tyre_brand: string | null;
  stock_order_status: string;
  quantity: number;
  fitter_name: string | null;
  job_type: string;
  source: string;
  status: string;
  service_required: string | null;
  issue_description: string | null;
  address_text: string | null;
  location_lat: unknown;
  location_lng: unknown;
  location_source: string | null;
  preferred_date: Date | null;
  preferred_time_text: string | null;
  scheduled_start: Date | null;
  scheduled_end: Date | null;
  urgency: string;
  cost: unknown;
  price_estimate: unknown;
  payment_method: string | null;
  payment_status: string | null;
  notes: string | null;
  internal_notes: string | null;
  customer_notes: string | null;
  cancellation_reason: string | null;
  reschedule_requested_text: string | null;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
  customer?: {
    name: string | null;
    phone: string;
  };
}): JobRecord {
  return {
    ...job,
    customer_name: job.customer?.name ?? null,
    customer_phone: job.customer?.phone ?? null,
    location_lat: decimalToNumber(job.location_lat),
    location_lng: decimalToNumber(job.location_lng),
    cost: decimalToNumber(job.cost),
    price_estimate: decimalToNumber(job.price_estimate)
  };
}

function cleanOptional(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export class PrismaJobRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async updateCustomerName(customerId: string, name: string): Promise<void> {
    const cleanName = cleanOptional(name);
    if (!cleanName) {
      return;
    }

    await this.prisma.customer.update({
      where: { id: customerId },
      data: { name: cleanName }
    });
  }

  async createJob(input: CreateJobInput): Promise<JobRecord> {
    const jobReference = createJobReference();
    const phone = cleanOptional(input.phone);
    const customerName = cleanOptional(input.customer_name);

    const customer = input.customer_id
      ? await this.prisma.customer.update({
          where: { id: input.customer_id },
          data: customerName ? { name: customerName, last_seen_at: new Date() } : { last_seen_at: new Date() }
        })
      : phone
        ? await this.prisma.customer.upsert({
            where: { phone: normalizeWhatsAppAddress(phone) },
            update: {
              name: customerName || undefined,
              last_seen_at: new Date()
            },
            create: {
              phone: normalizeWhatsAppAddress(phone),
              name: customerName
            }
          })
        : await this.prisma.customer.create({
            data: {
              phone: `manual:${jobReference.toLowerCase()}`,
              name: customerName ?? "Manual customer"
            }
          });

    const job = await this.prisma.job.create({
      data: {
        job_reference: jobReference,
        customer_id: customer.id,
        conversation_id: input.conversation_id,
        assigned_user_id: cleanOptional(input.assigned_user_id),
        vehicle_registration: cleanOptional(input.vehicle_registration),
        tyre_size: cleanOptional(input.tyre_size),
        tyre_description: cleanOptional(input.tyre_description),
        tyre_brand: cleanOptional(input.tyre_brand),
        stock_order_status: input.stock_order_status ?? "unknown",
        quantity: input.quantity ?? 1,
        fitter_name: cleanOptional(input.fitter_name),
        job_type: input.job_type,
        source: input.source,
        status: input.status,
        service_required: cleanOptional(input.service_required),
        issue_description: cleanOptional(input.issue_description),
        address_text: cleanOptional(input.address_text),
        location_lat: input.location_lat,
        location_lng: input.location_lng,
        location_source: cleanOptional(input.location_source),
        preferred_date: input.preferred_date,
        preferred_time_text: cleanOptional(input.preferred_time_text),
        scheduled_start: input.scheduled_start,
        scheduled_end: input.scheduled_end,
        completed_at:
          input.completed_at ??
          (input.status === "completed" || input.status === "paid" ? new Date() : undefined),
        urgency: input.urgency,
        cost:
          input.cost === null || input.cost === undefined
            ? undefined
            : new Prisma.Decimal(input.cost),
        price_estimate:
          input.price_estimate === null || input.price_estimate === undefined
            ? undefined
            : new Prisma.Decimal(input.price_estimate),
        payment_method: input.payment_method ?? "not_paid",
        payment_status: input.payment_status ?? "pending",
        notes: cleanOptional(input.notes),
        internal_notes: cleanOptional(input.internal_notes),
        customer_notes: cleanOptional(input.customer_notes)
      },
      include: { customer: true }
    });

    return toJobRecord(job);
  }

  async listJobs(): Promise<JobRecord[]> {
    const jobs = await this.prisma.job.findMany({
      orderBy: [{ urgency: "asc" }, { updated_at: "desc" }],
      include: { customer: true }
    });
    return jobs.map(toJobRecord);
  }

  async getJob(jobId: string): Promise<JobRecord | null> {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { customer: true }
    });

    return job ? toJobRecord(job) : null;
  }

  async findActiveJobsForCustomer(customerId: string): Promise<JobRecord[]> {
    const jobs = await this.prisma.job.findMany({
      where: {
        customer_id: customerId,
        status: { in: activeJobStatuses }
      },
      orderBy: { updated_at: "desc" },
      include: { customer: true }
    });
    return jobs.map(toJobRecord);
  }

  async updateJob(jobId: string, input: Record<string, unknown>): Promise<JobRecord> {
    const job = await this.prisma.job.update({
      where: { id: jobId },
      data: {
        ...input,
        cost:
          input.cost === null || input.cost === undefined
            ? (input.cost as null | undefined)
            : new Prisma.Decimal(Number(input.cost)),
        price_estimate:
          input.price_estimate === null || input.price_estimate === undefined
            ? (input.price_estimate as null | undefined)
            : new Prisma.Decimal(Number(input.price_estimate))
      },
      include: { customer: true }
    });

    return toJobRecord(job);
  }

  async updateJobStatus(
    jobId: string,
    status: JobStatus,
    patch: Record<string, unknown> = {}
  ): Promise<JobRecord> {
    const job = await this.prisma.job.update({
      where: { id: jobId },
      data: {
        ...patch,
        status,
        completed_at: status === "completed" || status === "paid" ? new Date() : undefined
      },
      include: { customer: true }
    });

    return toJobRecord(job);
  }
}
