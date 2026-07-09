import { describe, expect, it } from "vitest";
import { canTransitionJobStatus } from "../core/jobs/jobLifecycle.js";
import { isCancellationIntent, isRescheduleIntent } from "../core/jobs/jobIntents.js";
import { manualJobCreateSchema } from "../core/jobs/jobSchemas.js";
import { jobSources, jobStatuses, paymentMethods, paymentStatuses, quoteStatuses, stockOrderStatuses } from "../core/jobs/jobTypes.js";
import { quoteCreateSchema } from "../core/quotes/quoteSchemas.js";

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

  it("allows completed job log entries without customer details", () => {
    const parsed = manualJobCreateSchema.safeParse({
      job_type: "walk_in",
      source: "walk_in",
      status: "completed",
      tyre_description: "Puncture repair",
      stock_order_status: "stock",
      quantity: 1,
      fitter_name: "Sam",
      cost: 20,
      payment_method: "card",
      payment_status: "paid"
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.source).toBe("walk_in");
      expect(parsed.data.status).toBe("completed");
      expect(parsed.data.payment_method).toBe("card");
    }
  });

  it("rejects blank manual job rows", () => {
    const parsed = manualJobCreateSchema.safeParse({
      job_type: "walk_in",
      status: "completed"
    });

    expect(parsed.success).toBe(false);
  });

  it("includes required job sources, statuses, and payment statuses", () => {
    expect(jobSources).toContain("manual");
    expect(jobSources).toContain("walk_in");
    expect(jobSources).toContain("whatsapp");
    expect(jobSources).toContain("phone");
    expect(jobSources).toContain("future_phone_ai");
    expect(jobStatuses).toContain("booked");
    expect(jobStatuses).toContain("no_show");
    expect(jobStatuses).toContain("awaiting_owner_confirmation");
    expect(paymentStatuses).toContain("part_paid");
    expect(paymentStatuses).toContain("refunded");
    expect(paymentMethods).toContain("bank_transfer");
    expect(stockOrderStatuses).toContain("customer_supplied");
    expect(quoteStatuses).toContain("converted_to_job");
  });

  it("allows practical owner status transitions", () => {
    expect(canTransitionJobStatus("awaiting_owner_confirmation", "confirmed")).toBe(true);
    expect(canTransitionJobStatus("new_request", "booked")).toBe(true);
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

  it("validates manual quote capture", () => {
    const parsed = quoteCreateSchema.safeParse({
      tyre_description: "205/55/R16 Budget",
      supplier_checked: "Supplier PC",
      supplier_price: 47,
      quoted_price: 72,
      status: "quoted"
    });

    expect(parsed.success).toBe(true);
  });
});
