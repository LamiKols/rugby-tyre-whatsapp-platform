import { z } from "zod";
import {
  jobSources,
  jobStatuses,
  jobTypes,
  manualJobSources,
  manualStartStatuses,
  paymentMethods,
  paymentStatuses,
  stockOrderStatuses,
  urgencyValues
} from "./jobTypes.js";

const optionalMoney = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().nonnegative().optional()
);

const nullableMoney = z.preprocess(
  (value) => (value === "" ? null : value),
  z.coerce.number().nonnegative().nullable().optional()
);

export const manualJobCreateSchema = z
  .object({
    customer_name: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    assigned_user_id: z.string().trim().optional(),
    vehicle_registration: z.string().trim().optional(),
    tyre_size: z.string().trim().optional(),
    tyre_description: z.string().trim().optional(),
    tyre_brand: z.string().trim().optional(),
    stock_order_status: z.enum(stockOrderStatuses).default("unknown"),
    quantity: z.coerce.number().int().positive().default(1),
    fitter_name: z.string().trim().optional(),
    job_type: z.enum(jobTypes).default("mobile"),
    source: z.enum(manualJobSources).default("manual"),
    service_required: z.string().trim().optional(),
    issue_description: z.string().trim().optional(),
    address_text: z.string().trim().optional(),
    preferred_date: z.string().trim().optional(),
    preferred_time_text: z.string().trim().optional(),
    completed_at: z.string().trim().optional(),
    urgency: z.enum(urgencyValues).default("unknown"),
    cost: optionalMoney,
    price_estimate: optionalMoney,
    payment_method: z.enum(paymentMethods).default("not_paid"),
    internal_notes: z.string().trim().optional(),
    customer_notes: z.string().trim().optional(),
    payment_status: z.enum(paymentStatuses).default("pending"),
    status: z.enum(manualStartStatuses).default("confirmed")
  })
  .refine((value) => Boolean(value.service_required || value.tyre_description), {
    message: "Service required or tyre description is required",
    path: ["tyre_description"]
  });

export const jobPatchSchema = z.object({
  customer_name: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  assigned_user_id: z.string().trim().nullable().optional(),
  vehicle_registration: z.string().trim().optional(),
  tyre_size: z.string().trim().optional(),
  tyre_description: z.string().trim().optional(),
  tyre_brand: z.string().trim().optional(),
  stock_order_status: z.enum(stockOrderStatuses).optional(),
  quantity: z.coerce.number().int().positive().optional(),
  fitter_name: z.string().trim().optional(),
  job_type: z.enum(jobTypes).optional(),
  source: z.enum(jobSources).optional(),
  status: z.enum(jobStatuses).optional(),
  service_required: z.string().trim().optional(),
  issue_description: z.string().trim().optional(),
  address_text: z.string().trim().optional(),
  preferred_date: z.string().trim().nullable().optional(),
  preferred_time_text: z.string().trim().optional(),
  completed_at: z.string().trim().nullable().optional(),
  urgency: z.enum(urgencyValues).optional(),
  cost: nullableMoney,
  price_estimate: nullableMoney,
  payment_method: z.enum(paymentMethods).optional(),
  payment_status: z.enum(paymentStatuses).optional(),
  notes: z.string().trim().optional(),
  internal_notes: z.string().trim().optional(),
  customer_notes: z.string().trim().optional(),
  cancellation_reason: z.string().trim().optional(),
  reschedule_requested_text: z.string().trim().optional()
});

export const jobStatusUpdateSchema = z.object({
  status: z.enum(jobStatuses),
  payment_status: z.enum(paymentStatuses).optional(),
  payment_method: z.enum(paymentMethods).optional(),
  preferred_date: z.string().trim().nullable().optional(),
  preferred_time_text: z.string().trim().optional(),
  scheduled_start: z.string().trim().nullable().optional(),
  scheduled_end: z.string().trim().nullable().optional(),
  cancellation_reason: z.string().trim().optional(),
  reschedule_requested_text: z.string().trim().optional()
});
