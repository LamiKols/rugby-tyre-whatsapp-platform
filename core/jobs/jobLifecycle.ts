import { type JobStatus, jobStatuses } from "./jobTypes.js";

const allowedTransitions: Record<JobStatus, JobStatus[]> = {
  new_request: ["awaiting_owner_confirmation", "confirmed", "scheduled", "cancelled"],
  awaiting_owner_confirmation: [
    "confirmed",
    "scheduled",
    "reschedule_requested",
    "cancellation_requested",
    "cancelled",
    "unable_to_complete"
  ],
  confirmed: [
    "scheduled",
    "reschedule_requested",
    "cancellation_requested",
    "en_route",
    "arrived",
    "in_progress",
    "completed",
    "payment_pending",
    "paid",
    "cancelled",
    "no_show"
  ],
  scheduled: [
    "reschedule_requested",
    "cancellation_requested",
    "en_route",
    "arrived",
    "in_progress",
    "completed",
    "payment_pending",
    "paid",
    "cancelled",
    "no_show"
  ],
  reschedule_requested: ["rescheduled", "scheduled", "confirmed", "cancelled"],
  rescheduled: ["scheduled", "confirmed", "en_route", "cancellation_requested", "completed", "payment_pending", "paid"],
  cancellation_requested: ["cancelled", "confirmed", "scheduled"],
  cancelled: [],
  no_show: ["cancelled"],
  en_route: ["arrived", "in_progress", "unable_to_complete", "cancelled"],
  arrived: ["in_progress", "completed", "unable_to_complete"],
  in_progress: ["completed", "payment_pending", "paid", "unable_to_complete"],
  completed: ["payment_pending", "paid"],
  payment_pending: ["paid", "completed"],
  paid: [],
  unable_to_complete: ["cancelled", "payment_pending"]
};

export function canTransitionJobStatus(from: JobStatus, to: JobStatus): boolean {
  if (!jobStatuses.includes(from) || !jobStatuses.includes(to)) {
    return false;
  }

  if (from === to) {
    return true;
  }

  return allowedTransitions[from].includes(to);
}
