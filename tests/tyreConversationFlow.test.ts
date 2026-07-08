import { describe, expect, it } from "vitest";
import type { ConversationFlowContext } from "../core/conversations/types.js";
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
  const flow = new TyreConversationFlow(new SeedTyreRepository());

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
    ["2", "mobile_callout_phase_1_stub"],
    ["4", "menu_option_human"],
    ["HELP", "customer_requested_human"],
    ["HUMAN", "customer_requested_human"],
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
});

