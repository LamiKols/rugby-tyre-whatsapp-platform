ALTER TABLE "jobs" ADD COLUMN "assigned_user_id" TEXT;
ALTER TABLE "jobs" ADD COLUMN "tyre_description" TEXT;
ALTER TABLE "jobs" ADD COLUMN "stock_order_status" TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE "jobs" ADD COLUMN "quantity" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "jobs" ADD COLUMN "fitter_name" TEXT;
ALTER TABLE "jobs" ADD COLUMN "cost" DECIMAL(10,2);
ALTER TABLE "jobs" ADD COLUMN "payment_method" TEXT DEFAULT 'not_paid';

CREATE TABLE "quotes" (
  "id" TEXT NOT NULL,
  "quote_reference" TEXT NOT NULL,
  "customer_name" TEXT,
  "phone" TEXT,
  "vehicle_registration" TEXT,
  "tyre_size" TEXT,
  "tyre_description" TEXT NOT NULL,
  "supplier_checked" TEXT,
  "supplier_price" DECIMAL(10,2),
  "quoted_price" DECIMAL(10,2),
  "status" TEXT NOT NULL DEFAULT 'draft',
  "notes" TEXT,
  "converted_job_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "quotes_quote_reference_key" ON "quotes"("quote_reference");
CREATE INDEX "jobs_stock_order_status_idx" ON "jobs"("stock_order_status");
CREATE INDEX "quotes_status_idx" ON "quotes"("status");
CREATE INDEX "quotes_phone_idx" ON "quotes"("phone");
CREATE INDEX "quotes_converted_job_id_idx" ON "quotes"("converted_job_id");

ALTER TABLE "quotes" ADD CONSTRAINT "quotes_converted_job_id_fkey" FOREIGN KEY ("converted_job_id") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
