import { describe, expect, it } from "vitest";
import { canTransitionJobStatus } from "../core/jobs/jobLifecycle.js";
import { isCancellationIntent, isRescheduleIntent } from "../core/jobs/jobIntents.js";
import { manualJobCreateSchema } from "../core/jobs/jobSchemas.js";
import { jobSources, jobStatuses, paymentStatuses } from "../core/jobs/jobTypes.js";

describe("job domain", () => {
  it("validates quick manual job creation with sensible defaults", () => {
    const parsed = manualJobCreateSchema.safeParse({
      customer_name: "Walk-in customer",
      job_type: "in_shop",
      service_required: "Tyre replacement"
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.source).toBe("manual");
      expect(parsed.data.status).toBe("confirmed");
      expect(parsed.data.payment_status).toBe("pending");
      expect(parsed.data.urgency).toBe("unknown");
    }
  });

  it("requires either customer phone or name for manual jobs", () => {
    const parsed = manualJobCreateSchema.safeParse({
      job_type: "mobile",
      service_required: "Puncture repair"
    });

    expect(parsed.success).toBe(false);
  });

  it("includes required job sources, statuses, and payment statuses", () => {
    expect(jobSources).toContain("manual");
    expect(jobSources).toContain("walk_in");
    expect(jobSources).toContain("whatsapp");
    expect(jobSources).toContain("phone");
    expect(jobSources).toContain("future_phone_ai");
    expect(jobStatuses).toContain("no_show");
    expect(jobStatuses).toContain("awaiting_owner_confirmation");
    expect(paymentStatuses).toContain("payment_pending");
    expect(paymentStatuses).toContain("part_paid");
  });

  it("allows practical owner status transitions", () => {
    expect(canTransitionJobStatus("awaiting_owner_confirmation", "confirmed")).toBe(true);
    expect(canTransitionJobStatus("scheduled", "no_show")).toBe(true);
    expect(canTransitionJobStatus("scheduled", "paid")).toBe(true);
    expect(canTransitionJobStatus("completed", "paid")).toBe(true);
    expect(canTransitionJobStatus("paid", "scheduled")).toBe(false);
  });

  it("detects cancellation and reschedule customer intent", () => {
    expect(isCancellationIntent("cancel my booking please")).toBe(true);
    expect(isCancellationIntent("I no longer need it")).toBe(true);
    expect(isRescheduleIntent("can you come later?")).toBe(true);
    expect(isRescheduleIntent("can I rebook?")).toBe(true);
  });
});
