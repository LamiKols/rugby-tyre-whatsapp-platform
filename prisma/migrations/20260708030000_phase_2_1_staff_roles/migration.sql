CREATE INDEX "jobs_assigned_user_id_idx" ON "jobs"("assigned_user_id");

ALTER TABLE "jobs" ADD CONSTRAINT "jobs_assigned_user_id_fkey" FOREIGN KEY ("assigned_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
