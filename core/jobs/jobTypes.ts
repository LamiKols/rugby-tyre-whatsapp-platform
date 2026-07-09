export const jobSources = ["manual", "walk_in", "whatsapp", "phone", "future_phone_ai"] as const;
export type JobSource = (typeof jobSources)[number];

export const manualJobSources = ["manual", "walk_in", "phone"] as const;
export type ManualJobSource = (typeof manualJobSources)[number];

export const jobTypes = [
  "mobile",
  "emergency_mobile",
  "in_shop",
  "walk_in",
  "phone_booking",
  "other"
] as const;
export type JobType = (typeof jobTypes)[number];

export const jobStatuses = [
  "new_request",
  "awaiting_owner_confirmation",
  "booked",
  "confirmed",
  "scheduled",
  "reschedule_requested",
  "rescheduled",
  "cancellation_requested",
  "cancelled",
  "no_show",
  "en_route",
  "arrived",
  "in_progress",
  "completed",
  "payment_pending",
  "paid",
  "unable_to_complete"
] as const;
export type JobStatus = (typeof jobStatuses)[number];

export const manualStartStatuses = ["new_request", "booked", "confirmed", "scheduled", "completed"] as const;
export type ManualStartStatus = (typeof manualStartStatuses)[number];

export const paymentStatuses = [
  "not_required",
  "pending",
  "paid",
  "part_paid",
  "failed",
  "refunded"
] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];

export const paymentMethods = ["cash", "card", "bank_transfer", "not_paid", "other"] as const;
export type PaymentMethod = (typeof paymentMethods)[number];

export const stockOrderStatuses = ["stock", "ordered", "customer_supplied", "not_applicable", "unknown"] as const;
export type StockOrderStatus = (typeof stockOrderStatuses)[number];

export const quoteStatuses = [
  "draft",
  "price_checked",
  "quoted",
  "accepted",
  "declined",
  "expired",
  "converted_to_job"
] as const;
export type QuoteStatus = (typeof quoteStatuses)[number];

export const urgencyValues = ["emergency", "today", "tomorrow", "flexible", "unknown"] as const;
export type Urgency = (typeof urgencyValues)[number];

export const activeJobStatuses: JobStatus[] = [
  "new_request",
  "awaiting_owner_confirmation",
  "booked",
  "confirmed",
  "scheduled",
  "reschedule_requested",
  "rescheduled",
  "cancellation_requested",
  "en_route",
  "arrived",
  "in_progress",
  "payment_pending"
];

export function isJobSource(value: string): value is JobSource {
  return jobSources.includes(value as JobSource);
}

export function isJobStatus(value: string): value is JobStatus {
  return jobStatuses.includes(value as JobStatus);
}

export function isPaymentStatus(value: string): value is PaymentStatus {
  return paymentStatuses.includes(value as PaymentStatus);
}

export function isPaymentMethod(value: string): value is PaymentMethod {
  return paymentMethods.includes(value as PaymentMethod);
}
