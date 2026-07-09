import { z } from "zod";
import {
  jobSources,
  jobStatuses,
  jobTypes,
  manualJobSources,
  manualStartStatuses,
  paymentStatuses,
  urgencyValues
} from "./jobTypes.js";

export const manualJobCreateSchema = z
  .object({
    customer_name: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    vehicle_registration: z.string().trim().optional(),
    tyre_size: z.string().trim().optional(),
    tyre_brand: z.string().trim().optional(),
    job_type: z.enum(jobTypes).default("mobile"),
    source: z.enum(manualJobSources).default("manual"),
    service_required: z.string().trim().min(1),
    issue_description: z.string().trim().optional(),
    address_text: z.string().trim().optional(),
    preferred_date: z.string().trim().optional(),
    preferred_time_text: z.string().trim().optional(),
    urgency: z.enum(urgencyValues).default("unknown"),
    price_estimate: z.coerce.number().nonnegative().optional(),
    internal_notes: z.string().trim().optional(),
    customer_notes: z.string().trim().optional(),
    payment_status: z.enum(paymentStatuses).default("pending"),
    status: z.enum(manualStartStatuses).default("confirmed")
  })
  .refine((value) => Boolean(value.phone || value.customer_name), {
    message: "Customer phone number or customer name is required",
    path: ["phone"]
  });

export const jobPatchSchema = z.object({
  customer_name: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  vehicle_registration: z.string().trim().optional(),
  tyre_size: z.string().trim().optional(),
  tyre_brand: z.string().trim().optional(),
  job_type: z.enum(jobTypes).optional(),
  source: z.enum(jobSources).optional(),
  status: z.enum(jobStatuses).optional(),
  service_required: z.string().trim().optional(),
  issue_description: z.string().trim().optional(),
  address_text: z.string().trim().optional(),
  preferred_date: z.string().trim().nullable().optional(),
  preferred_time_text: z.string().trim().optional(),
  urgency: z.enum(urgencyValues).optional(),
  price_estimate: z.coerce.number().nonnegative().nullable().optional(),
  payment_status: z.enum(paymentStatuses).optional(),
  internal_notes: z.string().trim().optional(),
  customer_notes: z.string().trim().optional(),
  cancellation_reason: z.string().trim().optional(),
  reschedule_requested_text: z.string().trim().optional()
});

export const jobStatusUpdateSchema = z.object({
  status: z.enum(jobStatuses),
  payment_status: z.enum(paymentStatuses).optional(),
  preferred_date: z.string().trim().nullable().optional(),
  preferred_time_text: z.string().trim().optional(),
  scheduled_start: z.string().trim().nullable().optional(),
  scheduled_end: z.string().trim().nullable().optional(),
  cancellation_reason: z.string().trim().optional(),
  reschedule_requested_text: z.string().trim().optional()
});

