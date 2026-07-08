export interface JobFoundation {
  job_reference: string;
  customer_id: string;
  job_type: string;
  source: "whatsapp" | "dashboard" | "walk_in" | "phone";
  status: "new" | "quoted" | "booked" | "in_progress" | "completed" | "cancelled";
  scheduled_start?: Date;
  scheduled_end?: Date;
  payment_status?: "unpaid" | "pending" | "paid" | "refunded";
}

