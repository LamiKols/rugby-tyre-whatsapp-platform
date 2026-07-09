import { Prisma, type PrismaClient } from "@prisma/client";
import { Router } from "express";
import { type AuditLogger } from "../../core/audit/auditService.js";
import { quoteConvertSchema, quoteCreateSchema, quotePatchSchema } from "../../core/quotes/quoteSchemas.js";
import { createQuoteReference } from "../../core/quotes/quoteReference.js";
import { idParamSchema } from "../../core/validation/common.js";
import { PrismaJobRepository } from "../repositories/prismaJobRepository.js";

function cleanOptional(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function decimalToNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  return Number(value);
}

function money(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return value;
  }

  return new Prisma.Decimal(value);
}

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

function serializeQuote(quote: {
  id: string;
  quote_reference: string;
  customer_name: string | null;
  phone: string | null;
  vehicle_registration: string | null;
  tyre_size: string | null;
  tyre_description: string;
  supplier_checked: string | null;
  supplier_price: unknown;
  quoted_price: unknown;
  status: string;
  notes: string | null;
  converted_job_id: string | null;
  created_at: Date;
  updated_at: Date;
}) {
  return {
    ...quote,
    supplier_price: decimalToNumber(quote.supplier_price),
    quoted_price: decimalToNumber(quote.quoted_price),
    created_at: quote.created_at.toISOString(),
    updated_at: quote.updated_at.toISOString()
  };
}

export function createDashboardQuoteRoutes(prisma: PrismaClient, auditLogger: AuditLogger) {
  const router = Router();
  const jobRepository = new PrismaJobRepository(prisma);

  router.get("/", async (_req, res, next) => {
    try {
      const quotes = await prisma.quote.findMany({
        orderBy: [{ updated_at: "desc" }]
      });

      res.json(quotes.map(serializeQuote));
    } catch (error) {
      next(error);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      const parsed = quoteCreateSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
      }

      const quote = await prisma.quote.create({
        data: {
          quote_reference: createQuoteReference(),
          customer_name: cleanOptional(parsed.data.customer_name),
          phone: cleanOptional(parsed.data.phone),
          vehicle_registration: cleanOptional(parsed.data.vehicle_registration),
          tyre_size: cleanOptional(parsed.data.tyre_size),
          tyre_description: parsed.data.tyre_description,
          supplier_checked: cleanOptional(parsed.data.supplier_checked),
          supplier_price: money(parsed.data.supplier_price),
          quoted_price: money(parsed.data.quoted_price),
          status: parsed.data.status,
          notes: cleanOptional(parsed.data.notes)
        }
      });

      await auditLogger.log({
        actor_type: "admin",
        action: "quote.created",
        entity_type: "quote",
        entity_id: quote.id,
        metadata: { quote_reference: quote.quote_reference }
      });

      res.status(201).json(serializeQuote(quote));
    } catch (error) {
      next(error);
    }
  });

  router.patch("/:id", async (req, res, next) => {
    try {
      const params = idParamSchema.safeParse(req.params);
      const parsed = quotePatchSchema.safeParse(req.body);
      if (!params.success || !parsed.success) {
        res.status(400).json({ error: "Invalid quote update" });
        return;
      }

      const quote = await prisma.quote.update({
        where: { id: params.data.id },
        data: {
          customer_name: parsed.data.customer_name === undefined ? undefined : cleanOptional(parsed.data.customer_name),
          phone: parsed.data.phone === undefined ? undefined : cleanOptional(parsed.data.phone),
          vehicle_registration:
            parsed.data.vehicle_registration === undefined ? undefined : cleanOptional(parsed.data.vehicle_registration),
          tyre_size: parsed.data.tyre_size === undefined ? undefined : cleanOptional(parsed.data.tyre_size),
          tyre_description: parsed.data.tyre_description,
          supplier_checked:
            parsed.data.supplier_checked === undefined ? undefined : cleanOptional(parsed.data.supplier_checked),
          supplier_price: money(parsed.data.supplier_price),
          quoted_price: money(parsed.data.quoted_price),
          status: parsed.data.status,
          notes: parsed.data.notes === undefined ? undefined : cleanOptional(parsed.data.notes)
        }
      });

      await auditLogger.log({
        actor_type: "admin",
        action: "quote.updated",
        entity_type: "quote",
        entity_id: quote.id,
        metadata: { quote_reference: quote.quote_reference }
      });

      res.json(serializeQuote(quote));
    } catch (error) {
      next(error);
    }
  });

  router.post("/:id/convert", async (req, res, next) => {
    try {
      const params = idParamSchema.safeParse(req.params);
      const parsed = quoteConvertSchema.safeParse(req.body);
      if (!params.success || !parsed.success) {
        res.status(400).json({ error: "Invalid quote conversion" });
        return;
      }

      const quote = await prisma.quote.findUnique({ where: { id: params.data.id } });
      if (!quote) {
        res.status(404).json({ error: "Quote not found" });
        return;
      }

      if (quote.converted_job_id) {
        res.status(409).json({ error: "Quote has already been converted" });
        return;
      }

      const isCompletedJob = parsed.data.target === "completed_job";
      const job = await jobRepository.createJob({
        customer_name: quote.customer_name ?? undefined,
        phone: quote.phone ?? undefined,
        vehicle_registration: quote.vehicle_registration ?? undefined,
        tyre_size: quote.tyre_size ?? undefined,
        tyre_description: quote.tyre_description,
        job_type: isCompletedJob ? "walk_in" : "in_shop",
        source: isCompletedJob ? "walk_in" : "manual",
        status: isCompletedJob ? "completed" : "booked",
        service_required: quote.tyre_description,
        preferred_date: isCompletedJob ? null : parseOptionalDate(parsed.data.appointment_date) ?? null,
        preferred_time_text: isCompletedJob ? undefined : cleanOptional(parsed.data.appointment_time),
        completed_at: isCompletedJob ? new Date() : null,
        urgency: "unknown",
        stock_order_status: parsed.data.stock_order_status,
        quantity: parsed.data.quantity,
        fitter_name: parsed.data.fitter_name,
        cost: quote.quoted_price === null ? null : Number(quote.quoted_price),
        price_estimate: quote.quoted_price === null ? null : Number(quote.quoted_price),
        payment_method: parsed.data.payment_method,
        payment_status: parsed.data.payment_status,
        notes: parsed.data.notes,
        internal_notes: `Converted from quote ${quote.quote_reference}`
      });

      const updatedQuote = await prisma.quote.update({
        where: { id: quote.id },
        data: {
          status: "converted_to_job",
          converted_job_id: job.id
        }
      });

      await auditLogger.log({
        actor_type: "admin",
        action: "quote.converted_to_job",
        entity_type: "quote",
        entity_id: quote.id,
        metadata: {
          quote_reference: quote.quote_reference,
          job_reference: job.job_reference,
          target: parsed.data.target
        }
      });

      res.status(201).json({ quote: serializeQuote(updatedQuote), job });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
