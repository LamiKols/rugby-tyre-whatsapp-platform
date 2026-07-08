export interface BookingFoundation {
  status:
    | "requested"
    | "confirmed"
    | "reschedule_requested"
    | "rescheduled"
    | "cancellation_requested"
    | "cancelled"
    | "no_show"
    | "completed";
  scheduled_start?: Date;
  scheduled_end?: Date;
}

