import { type Prisma, type PrismaClient } from "@prisma/client";
import type {
  ConversationPatch,
  ConversationRecord,
  ConversationRepository,
  CustomerRecord
} from "../../core/conversations/types.js";

function toConversationRecord(conversation: {
  id: string;
  customer_id: string;
  channel: string;
  status: string;
  current_intent: string | null;
  current_state: string;
  failed_attempts: number;
  handoff_required: boolean;
  handoff_reason: string | null;
}): ConversationRecord {
  return conversation;
}

function toCustomerRecord(customer: {
  id: string;
  phone: string;
  whatsapp_id: string | null;
  name: string | null;
}): CustomerRecord {
  return customer;
}

export class PrismaConversationRepository implements ConversationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async upsertCustomerFromWhatsApp(input: {
    phone: string;
    whatsappId?: string;
    name?: string;
  }): Promise<CustomerRecord> {
    const customer = await this.prisma.customer.upsert({
      where: { phone: input.phone },
      update: {
        whatsapp_id: input.whatsappId,
        name: input.name || undefined,
        last_seen_at: new Date()
      },
      create: {
        phone: input.phone,
        whatsapp_id: input.whatsappId,
        name: input.name
      }
    });

    return toCustomerRecord(customer);
  }

  async getOrCreateActiveConversation(customerId: string) {
    const existing = await this.prisma.conversation.findFirst({
      where: {
        customer_id: customerId,
        status: { in: ["active", "handoff_required"] }
      },
      orderBy: { updated_at: "desc" }
    });

    if (existing) {
      return {
        conversation: toConversationRecord(existing),
        created: false
      };
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        customer_id: customerId,
        channel: "whatsapp",
        status: "active",
        current_state: "menu"
      }
    });

    return {
      conversation: toConversationRecord(conversation),
      created: true
    };
  }

  async updateConversation(conversationId: string, patch: ConversationPatch): Promise<ConversationRecord> {
    const conversation = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: patch
    });

    return toConversationRecord(conversation);
  }

  async logMessage(input: {
    conversationId: string;
    customerId: string;
    direction: "inbound" | "outbound";
    provider: string;
    providerMessageId?: string;
    body?: string;
    messageType: string;
    mediaUrl?: string;
    locationLat?: number;
    locationLng?: number;
    rawPayload?: Record<string, unknown>;
  }): Promise<void> {
    await this.prisma.conversationMessage.create({
      data: {
        conversation_id: input.conversationId,
        customer_id: input.customerId,
        direction: input.direction,
        provider: input.provider,
        provider_message_id: input.providerMessageId,
        body: input.body,
        message_type: input.messageType,
        media_url: input.mediaUrl,
        location_lat: input.locationLat,
        location_lng: input.locationLng,
        raw_payload: input.rawPayload as Prisma.InputJsonValue | undefined
      }
    });
  }
}
