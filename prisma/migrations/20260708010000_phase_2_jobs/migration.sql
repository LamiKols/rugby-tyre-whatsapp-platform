ALTER TABLE "conversations" ADD COLUMN "state_data" JSONB;

ALTER TABLE "jobs" ADD COLUMN "conversation_id" TEXT;
ALTER TABLE "jobs" ADD COLUMN "service_required" TEXT;
ALTER TABLE "jobs" ADD COLUMN "address_text" TEXT;
ALTER TABLE "jobs" ADD COLUMN "location_lat" DECIMAL(10,7);
ALTER TABLE "jobs" ADD COLUMN "location_lng" DECIMAL(10,7);
ALTER TABLE "jobs" ADD COLUMN "location_source" TEXT;
ALTER TABLE "jobs" ADD COLUMN "preferred_date" TIMESTAMP(3);
ALTER TABLE "jobs" ADD COLUMN "preferred_time_text" TEXT;
ALTER TABLE "jobs" ADD COLUMN "urgency" TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE "jobs" ADD COLUMN "price_estimate" DECIMAL(10,2);
ALTER TABLE "jobs" ALTER COLUMN "status" SET DEFAULT 'new_request';
ALTER TABLE "jobs" ALTER COLUMN "payment_status" SET DEFAULT 'pending';
ALTER TABLE "jobs" ADD COLUMN "internal_notes" TEXT;
ALTER TABLE "jobs" ADD COLUMN "customer_notes" TEXT;
ALTER TABLE "jobs" ADD COLUMN "cancellation_reason" TEXT;
ALTER TABLE "jobs" ADD COLUMN "reschedule_requested_text" TEXT;

CREATE INDEX "jobs_conversation_id_idx" ON "jobs"("conversation_id");
CREATE INDEX "jobs_source_idx" ON "jobs"("source");
CREATE INDEX "jobs_urgency_idx" ON "jobs"("urgency");

ALTER TABLE "jobs" ADD CONSTRAINT "jobs_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

