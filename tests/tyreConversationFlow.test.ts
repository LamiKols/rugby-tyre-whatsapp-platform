import { describe, expect, it } from "vitest";
import type { ConversationFlowContext } from "../core/conversations/types.js";
import type { CreateJobInput, JobIntakeRepository, JobRecord } from "../core/jobs/jobRepository.js";
import type { JobStatus } from "../core/jobs/jobTypes.js";
import { tyreSeedData } from "../modules/tyres/seedData.js";
import type { TyreCatalogueOption, TyreCatalogueRepository } from "../modules/tyres/tyreCatalogueService.js";
import { TyreConversationFlow } from "../modules/tyres/tyreConversationFlow.js";

class SeedTyreRepository implements TyreCatalogueRepository {
  async findActiveBySize(size: string): Promise<TyreCatalogueOption[]> {
    return tyreSeedData
      .filter((item) => item.size === size && item.active)
      .map((item, index) => ({ ...item, id: `tyre-${index}` }));
  }
}

class MemoryJobRepository implements JobIntakeRepository {
  jobs: JobRecord[] = [];
  customerNames: Record<string, string> = {};

  async createJob(input: CreateJobInput): Promise<JobRecord> {
    const job: JobRecord = {
      id: `job-${this.jobs.length + 1}`,
      job_reference: `RTS-${this.jobs.length + 1}`,
      customer_id: input.customer_id ?? "customer-1",
      conversation_id: input.conversation_id,
      customer_name: input.customer_name,
      customer_phone: input.phone ?? "+447700900000",
      vehicle_registration: input.vehicle_registration,
      tyre_size: input.tyre_size,
      tyre_brand: input.tyre_brand,
      job_type: input.job_type,
      source: input.source,
      status: input.status,
      service_required: input.service_required,
      issue_description: input.issue_description,
      address_text: input.address_text,
      location_lat: input.location_lat,
      location_lng: input.location_lng,
      location_source: input.location_source,
      preferred_date: input.preferred_date,
      preferred_time_text: input.preferred_time_text,
      scheduled_start: input.scheduled_start,
      scheduled_end: input.scheduled_end,
      urgency: input.urgency,
      price_estimate: input.price_estimate,
      payment_status: input.payment_status,
      internal_notes: input.internal_notes,
      customer_notes: input.customer_notes,
      created_at: new Date(),
      updated_at: new Date()
    };
    this.jobs.push(job);
    return job;
  }

  async findActiveJobsForCustomer(customerId: string): Promise<JobRecord[]> {
    return this.jobs.filter(
      (job) =>
        job.customer_id === customerId &&
        !["completed", "cancelled", "paid", "no_show", "unable_to_complete"].includes(job.status)
    );
  }

  async updateJobStatus(jobId: string, status: JobStatus, patch: Partial<JobRecord> = {}): Promise<JobRecord> {
    const job = this.jobs.find((item) => item.id === jobId);
    if (!job) {
      throw new Error("Job not found");
    }
    Object.assign(job, patch, { status });
    return job;
  }

  async updateCustomerName(customerId: string, name: string): Promise<void> {
    this.customerNames[customerId] = name;
  }
}

function context(body: string, overrides: Partial<ConversationFlowContext> = {}): ConversationFlowContext {
  return {
    customer: { id: "customer-1", phone: "+447700900000" },
    conversation: {
      id: "conversation-1",
      customer_id: "customer-1",
      channel: "whatsapp",
      status: "active",
      current_intent: null,
      current_state: "menu",
      failed_attempts: 0,
      state_data: null,
      handoff_required: false,
      handoff_reason: null
    },
    inbound: {
      from: "+447700900000",
      body,
      messageType: "text",
      rawPayload: {}
    },
    isNewConversation: false,
    ...overrides
  };
}

describe("Rugby Tyre WhatsApp menu flow", () => {
  const jobRepository = new MemoryJobRepository();
  const flow = new TyreConversationFlow(new SeedTyreRepository(), jobRepository);

  it("sends the greeting menu for a new conversation", async () => {
    const result = await flow.handle(context("hello", { isNewConversation: true }));

    expect(result.replies[0]).toContain("Hi, this is Rugby Tyre Services");
    expect(result.replies[0]).toContain("3. Check tyre size or price");
  });

  it("starts tyre lookup for option 3", async () => {
    const result = await flow.handle(context("3"));

    expect(result.replies[0]).toContain("Please send your tyre size");
    expect(result.conversationPatch).toMatchObject({
      current_intent: "tyre_lookup",
      current_state: "awaiting_tyre_size"
    });
  });

  it("returns matching tyre options from seed data", async () => {
    const result = await flow.handle(
      context("205-55-16", {
        conversation: {
          ...context("x").conversation,
          current_intent: "tyre_lookup",
          current_state: "awaiting_tyre_size"
        }
      })
    );

    expect(result.replies[0]).toContain("We have options for 205/55/R16");
    expect(result.replies[0]).toContain("Budget brand");
    expect(result.replies[0]).toContain("placeholder prices");
    expect(result.conversationPatch).toMatchObject({
      current_state: "menu",
      failed_attempts: 0,
      handoff_required: false
    });
  });

  it("triggers handoff when no tyre size is found", async () => {
    const result = await flow.handle(
      context("185/50/R16", {
        conversation: {
          ...context("x").conversation,
          current_state: "awaiting_tyre_size"
        }
      })
    );

    expect(result.replies[0]).toContain("I could not find that tyre size");
    expect(result.conversationPatch).toMatchObject({
      handoff_required: true,
      handoff_reason: "tyre_size_not_found"
    });
  });

  it.each([
    ["1", "appointment_booking_phase_1_stub"],
    ["4", "menu_option_human"],
    ["HELP", "customer_requested_human"],
    ["HUMAN", "customer_requested_human"],
    ["CALL", "customer_requested_human"],
    ["SPEAK TO SOMEONE", "customer_requested_human"]
  ])("triggers handoff for %s", async (message, reason) => {
    const result = await flow.handle(context(message));

    expect(result.conversationPatch).toMatchObject({
      handoff_required: true,
      handoff_reason: reason
    });
  });

  it("asks again on first unknown message", async () => {
    const result = await flow.handle(context("random question"));

    expect(result.replies[0]).toContain("Please choose one of the menu options");
    expect(result.conversationPatch).toMatchObject({ failed_attempts: 1 });
  });

  it("requires human handoff after two failed attempts", async () => {
    const result = await flow.handle(
      context("still random", {
        conversation: {
          ...context("x").conversation,
          failed_attempts: 1
        }
      })
    );

    expect(result.conversationPatch).toMatchObject({
      handoff_required: true,
      handoff_reason: "unrecognised_message_after_two_attempts"
    });
  });

  it("starts mobile job intake for option 2", async () => {
    const result = await flow.handle(context("2"));

    expect(result.replies[0]).toContain("I can help take the details");
    expect(result.conversationPatch).toMatchObject({
      current_intent: "mobile_job_intake",
      current_state: "awaiting_mobile_customer_name",
      handoff_required: false
    });
  });

  it("creates a pending WhatsApp mobile job after intake", async () => {
    const repo = new MemoryJobRepository();
    const intakeFlow = new TyreConversationFlow(new SeedTyreRepository(), repo);

    const customerName = await intakeFlow.handle(
      context("Pat Driver", {
        conversation: {
          ...context("x").conversation,
          current_intent: "mobile_job_intake",
          current_state: "awaiting_mobile_customer_name",
          state_data: {}
        }
      })
    );
    const vehicle = await intakeFlow.handle(
      context("AB12 CDE", {
        conversation: {
          ...context("x").conversation,
          current_state: "awaiting_mobile_vehicle_reg",
          state_data: customerName.conversationPatch?.state_data
        }
      })
    );
    const tyre = await intakeFlow.handle(
      context("2055516", {
        conversation: {
          ...context("x").conversation,
          current_state: "awaiting_mobile_tyre_size",
          state_data: vehicle.conversationPatch?.state_data
        }
      })
    );
    const issue = await intakeFlow.handle(
      context("1", {
        conversation: {
          ...context("x").conversation,
          current_state: "awaiting_mobile_issue_type",
          state_data: tyre.conversationPatch?.state_data
        }
      })
    );
    const location = await intakeFlow.handle(
      context("1 High Street, Rugby", {
        conversation: {
          ...context("x").conversation,
          current_state: "awaiting_mobile_location",
          state_data: issue.conversationPatch?.state_data
        }
      })
    );
    const locationType = await intakeFlow.handle(
      context("3", {
        conversation: {
          ...context("x").conversation,
          current_state: "awaiting_mobile_location_type",
          state_data: location.conversationPatch?.state_data
        }
      })
    );
    const preferredTime = await intakeFlow.handle(
      context("today afternoon", {
        conversation: {
          ...context("x").conversation,
          current_state: "awaiting_mobile_preferred_time",
          state_data: locationType.conversationPatch?.state_data
        }
      })
    );
    const urgency = await intakeFlow.handle(
      context("1", {
        conversation: {
          ...context("x").conversation,
          current_state: "awaiting_mobile_urgency",
          state_data: preferredTime.conversationPatch?.state_data
        }
      })
    );
    const complete = await intakeFlow.handle(
      context("Please call when nearby", {
        conversation: {
          ...context("x").conversation,
          current_state: "awaiting_mobile_additional_notes",
          state_data: urgency.conversationPatch?.state_data
        }
      })
    );

    expect(repo.jobs).toHaveLength(1);
    expect(repo.jobs[0]).toMatchObject({
      source: "whatsapp",
      status: "awaiting_owner_confirmation",
      job_type: "emergency_mobile",
      tyre_size: "205/55/R16",
      vehicle_registration: "AB12 CDE"
    });
    expect(complete.replies[0]).toContain("request has been received");
  });

  it("detects cancellation intent for a clear active job", async () => {
    const repo = new MemoryJobRepository();
    await repo.createJob({
      customer_id: "customer-1",
      job_type: "mobile",
      source: "whatsapp",
      status: "scheduled",
      service_required: "Mobile tyre service",
      urgency: "today"
    });
    const intakeFlow = new TyreConversationFlow(new SeedTyreRepository(), repo);
    const result = await intakeFlow.handle(context("cancel my booking"));

    expect(repo.jobs[0].status).toBe("cancellation_requested");
    expect(result.replies[0]).toContain("cancellation request");
  });

  it("detects reschedule intent and stores requested new time", async () => {
    const repo = new MemoryJobRepository();
    const job = await repo.createJob({
      customer_id: "customer-1",
      job_type: "mobile",
      source: "whatsapp",
      status: "scheduled",
      service_required: "Mobile tyre service",
      urgency: "today"
    });
    const intakeFlow = new TyreConversationFlow(new SeedTyreRepository(), repo);
    const start = await intakeFlow.handle(context("can you come later?"));
    const stored = await intakeFlow.handle(
      context("tomorrow morning", {
        conversation: {
          ...context("x").conversation,
          current_state: "awaiting_reschedule_time",
          state_data: start.conversationPatch?.state_data
        }
      })
    );

    expect(job.status).toBe("reschedule_requested");
    expect(job.reschedule_requested_text).toBe("tomorrow morning");
    expect(stored.replies[0]).toContain("preferred new time");
  });
});
