export interface Job {
  id: string;
  job_reference: string;
  conversation_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
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
  location_lat: number | null;
  location_lng: number | null;
  location_source: string | null;
  preferred_date: string | null;
  preferred_time_text: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  urgency: string;
  cost: number | null;
  price_estimate: number | null;
  payment_method: string | null;
  payment_status: string | null;
  notes: string | null;
  internal_notes: string | null;
  customer_notes: string | null;
  cancellation_reason: string | null;
  reschedule_requested_text: string | null;
  completed_at: string | null;
  updated_at: string;
}

export const completedStatuses = ["completed", "payment_pending", "paid"];
export const closedStatuses = ["completed", "cancelled", "paid", "no_show"];

export function compactStatus(status: string) {
  return status.replaceAll("_", " ");
}

export function sourceLabel(source: string) {
  return (
    {
      manual: "Manual",
      walk_in: "Walk-in",
      whatsapp: "WhatsApp",
      phone: "Phone",
      future_phone_ai: "Future Phone AI"
    }[source] ?? source
  );
}

export function statusTone(status: string): "green" | "amber" | "red" | "slate" {
  if (["cancelled", "unable_to_complete", "no_show", "cancellation_requested"].includes(status)) {
    return "red";
  }
  if (["awaiting_owner_confirmation", "reschedule_requested", "payment_pending"].includes(status)) {
    return "amber";
  }
  if (["booked", "confirmed", "scheduled", "completed", "paid"].includes(status)) {
    return "green";
  }
  return "slate";
}

export function urgencyTone(urgency: string): "green" | "amber" | "red" | "slate" {
  if (urgency === "emergency") return "red";
  if (urgency === "today") return "amber";
  if (urgency === "tomorrow" || urgency === "flexible") return "green";
  return "slate";
}

export function stockOrderLabel(value: string | null | undefined) {
  return (
    {
      stock: "Stock",
      ordered: "Ordered",
      customer_supplied: "Customer supplied",
      not_applicable: "N/A",
      unknown: "Unknown"
    }[value ?? "unknown"] ?? value
  );
}

export function paymentMethodLabel(value: string | null | undefined) {
  return (
    {
      cash: "Cash",
      card: "Card",
      bank_transfer: "Bank transfer",
      not_paid: "Not paid",
      other: "Other"
    }[value ?? "not_paid"] ?? value
  );
}

export function jobDisplayDate(job: Job) {
  return job.completed_at || job.scheduled_start || job.preferred_date || job.updated_at;
}

export function tyreDescription(job: Job) {
  return job.tyre_description || job.tyre_size || job.service_required || "Not recorded";
}
