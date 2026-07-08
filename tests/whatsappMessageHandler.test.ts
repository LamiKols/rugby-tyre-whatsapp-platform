import { describe, expect, it } from "vitest";
import type { ConversationFlow, OutboundMessenger } from "../core/conversations/types.js";
import { handleIncomingWhatsAppMessage } from "../core/conversations/whatsappMessageHandler.js";
import { MemoryConversationRepository } from "./helpers/memoryConversationRepository.js";

describe("core WhatsApp message handler", () => {
  it("creates a customer, conversation, and logs inbound and outbound messages", async () => {
    const repository = new MemoryConversationRepository();
    const flow: ConversationFlow = {
      async handle() {
        return {
          replies: ["Hello from the shop"],
          conversationPatch: { current_state: "menu" }
        };
      }
    };
    const messenger: OutboundMessenger = {
      async sendWhatsAppMessage() {
        return { providerMessageId: "SM-outbound" };
      }
    };

    const result = await handleIncomingWhatsAppMessage(
      {
        from: "whatsapp:+447700900123",
        whatsappId: "447700900123",
        profileName: "Pat",
        body: "Hi",
        providerMessageId: "SM-inbound",
        messageType: "text",
        rawPayload: { Body: "Hi" }
      },
      { repository, flow, messenger }
    );

    expect(result.customer.phone).toBe("+447700900123");
    expect(repository.customers).toHaveLength(1);
    expect(repository.conversations).toHaveLength(1);
    expect(repository.messages).toHaveLength(2);
    expect(repository.messages[0]).toMatchObject({ direction: "inbound", body: "Hi" });
    expect(repository.messages[1]).toMatchObject({ direction: "outbound", body: "Hello from the shop" });
  });
});

