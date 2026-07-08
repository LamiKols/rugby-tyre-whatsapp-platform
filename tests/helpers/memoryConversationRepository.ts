import type {
  ConversationLookupResult,
  ConversationPatch,
  ConversationRecord,
  ConversationRepository,
  CustomerRecord
} from "../../core/conversations/types.js";

export class MemoryConversationRepository implements ConversationRepository {
  customers: CustomerRecord[] = [];
  conversations: ConversationRecord[] = [];
  messages: Array<{
    conversationId: string;
    customerId: string;
    direction: "inbound" | "outbound";
    body?: string;
  }> = [];

  async upsertCustomerFromWhatsApp(input: {
    phone: string;
    whatsappId?: string;
    name?: string;
  }): Promise<CustomerRecord> {
    const existing = this.customers.find((customer) => customer.phone === input.phone);
    if (existing) {
      existing.whatsapp_id = input.whatsappId;
      existing.name = input.name ?? existing.name;
      return existing;
    }

    const customer: CustomerRecord = {
      id: `customer-${this.customers.length + 1}`,
      phone: input.phone,
      whatsapp_id: input.whatsappId,
      name: input.name
    };
    this.customers.push(customer);
    return customer;
  }

  async getOrCreateActiveConversation(customerId: string): Promise<ConversationLookupResult> {
    const existing = this.conversations.find((conversation) => conversation.customer_id === customerId);
    if (existing) {
      return { conversation: existing, created: false };
    }

    const conversation: ConversationRecord = {
      id: `conversation-${this.conversations.length + 1}`,
      customer_id: customerId,
      channel: "whatsapp",
      status: "active",
      current_intent: null,
      current_state: "menu",
      failed_attempts: 0,
      handoff_required: false,
      handoff_reason: null
    };
    this.conversations.push(conversation);
    return { conversation, created: true };
  }

  async updateConversation(conversationId: string, patch: ConversationPatch): Promise<ConversationRecord> {
    const conversation = this.conversations.find((item) => item.id === conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    Object.assign(conversation, patch);
    return conversation;
  }

  async logMessage(input: {
    conversationId: string;
    customerId: string;
    direction: "inbound" | "outbound";
    body?: string;
  }): Promise<void> {
    this.messages.push(input);
  }
}

