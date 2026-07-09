import type { JobSource, JobStatus, JobType, PaymentStatus, Urgency } from "./jobTypes.js";

export interface JobRecord {
  id: string;
  job_reference: string;
  customer_id: string;
  conversation_id?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  vehicle_registration?: string | null;
  tyre_size?: string | null;
  tyre_brand?: string | null;
  job_type: string;
  source: string;
  status: string;
  service_required?: string | null;
  issue_description?: string | null;
  address_text?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  location_source?: string | null;
  preferred_date?: Date | null;
  preferred_time_text?: string | null;
  scheduled_start?: Date | null;
  scheduled_end?: Date | null;
  urgency: string;
  price_estimate?: number | null;
  payment_status?: string | null;
  internal_notes?: string | null;
  customer_notes?: string | null;
  cancellation_reason?: string | null;
  reschedule_requested_text?: string | null;
  completed_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateJobInput {
  customer_id?: string;
  customer_name?: string;
  phone?: string;
  conversation_id?: string;
  vehicle_registration?: string;
  tyre_size?: string;
  tyre_brand?: string;
  job_type: JobType;
  source: JobSource;
  status: JobStatus;
  service_required: string;
  issue_description?: string;
  address_text?: string;
  location_lat?: number;
  location_lng?: number;
  location_source?: string;
  preferred_date?: Date | null;
  preferred_time_text?: string;
  scheduled_start?: Date | null;
  scheduled_end?: Date | null;
  urgency: Urgency;
  price_estimate?: number | null;
  payment_status?: PaymentStatus;
  internal_notes?: string;
  customer_notes?: string;
}

export interface JobIntakeRepository {
  createJob(input: CreateJobInput): Promise<JobRecord>;
  findActiveJobsForCustomer(customerId: string): Promise<JobRecord[]>;
  updateJobStatus(
    jobId: string,
    status: JobStatus,
    patch?: Partial<Pick<JobRecord, "reschedule_requested_text" | "cancellation_reason" | "preferred_time_text">>
  ): Promise<JobRecord>;
  updateCustomerName(customerId: string, name: string): Promise<void>;
}

