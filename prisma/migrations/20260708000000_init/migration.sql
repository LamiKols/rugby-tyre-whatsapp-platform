CREATE TABLE "users" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "password_hash" TEXT,
  "role" TEXT NOT NULL DEFAULT 'owner',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "customers" (
  "id" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "whatsapp_id" TEXT,
  "name" TEXT,
  "email" TEXT,
  "notes" TEXT,
  "first_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "conversations" (
  "id" TEXT NOT NULL,
  "customer_id" TEXT NOT NULL,
  "channel" TEXT NOT NULL DEFAULT 'whatsapp',
  "status" TEXT NOT NULL DEFAULT 'active',
  "current_intent" TEXT,
  "current_state" TEXT NOT NULL DEFAULT 'menu',
  "failed_attempts" INTEGER NOT NULL DEFAULT 0,
  "handoff_required" BOOLEAN NOT NULL DEFAULT false,
  "handoff_reason" TEXT,
  "assigned_user_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "conversation_messages" (
  "id" TEXT NOT NULL,
  "conversation_id" TEXT NOT NULL,
  "customer_id" TEXT NOT NULL,
  "direction" TEXT NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'twilio',
  "provider_message_id" TEXT,
  "body" TEXT,
  "message_type" TEXT NOT NULL DEFAULT 'text',
  "media_url" TEXT,
  "location_lat" DECIMAL(10,7),
  "location_lng" DECIMAL(10,7),
  "raw_payload" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "conversation_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tyre_catalogue" (
  "id" TEXT NOT NULL,
  "size" TEXT NOT NULL,
  "width" INTEGER NOT NULL,
  "profile" INTEGER NOT NULL,
  "rim" INTEGER NOT NULL,
  "brand" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "price" DECIMAL(10,2) NOT NULL,
  "fitted_price" DECIMAL(10,2) NOT NULL,
  "availability_status" TEXT NOT NULL DEFAULT 'available',
  "quantity_available" INTEGER,
  "is_placeholder_seed_data" BOOLEAN NOT NULL DEFAULT true,
  "notes" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "tyre_catalogue_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_logs" (
  "id" TEXT NOT NULL,
  "actor_type" TEXT NOT NULL,
  "actor_id" TEXT,
  "action" TEXT NOT NULL,
  "entity_type" TEXT NOT NULL,
  "entity_id" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "jobs" (
  "id" TEXT NOT NULL,
  "job_reference" TEXT NOT NULL,
  "customer_id" TEXT NOT NULL,
  "vehicle_registration" TEXT,
  "job_type" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'new',
  "scheduled_start" TIMESTAMP(3),
  "scheduled_end" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "issue_description" TEXT,
  "tyre_size" TEXT,
  "tyre_brand" TEXT,
  "price" DECIMAL(10,2),
  "payment_status" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "customers_phone_key" ON "customers"("phone");
CREATE UNIQUE INDEX "jobs_job_reference_key" ON "jobs"("job_reference");
CREATE INDEX "conversations_customer_id_idx" ON "conversations"("customer_id");
CREATE INDEX "conversations_handoff_required_idx" ON "conversations"("handoff_required");
CREATE INDEX "conversation_messages_conversation_id_created_at_idx" ON "conversation_messages"("conversation_id", "created_at");
CREATE INDEX "tyre_catalogue_size_idx" ON "tyre_catalogue"("size");
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");
CREATE INDEX "jobs_customer_id_idx" ON "jobs"("customer_id");
CREATE INDEX "jobs_status_idx" ON "jobs"("status");

ALTER TABLE "conversations" ADD CONSTRAINT "conversations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_assigned_user_id_fkey" FOREIGN KEY ("assigned_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

