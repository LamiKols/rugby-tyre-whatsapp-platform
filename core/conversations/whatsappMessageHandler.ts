import { type AuditLogger, noopAuditLogger } from "../audit/auditService.js";
import { normalizeWhatsAppAddress, sanitizeMessageBody } from "../messages/safeLogging.js";
import {
  type ConversationFlow,
  type ConversationRepository,
  type IncomingWhatsAppMessage,
  type OutboundMessenger
} from "./types.js";

export interface WhatsAppHandlerDependencies {
  repository: ConversationRepository;
  flow: ConversationFlow;
  messenger: OutboundMessenger;
  auditLogger?: AuditLogger;
}

export async function handleIncomingWhatsAppMessage(
  input: IncomingWhatsAppMessage,
  dependencies: WhatsAppHandlerDependencies
) {
  const repository = dependencies.repository;
  const auditLogger = dependencies.auditLogger ?? noopAuditLogger;
  const phone = normalizeWhatsAppAddress(input.from);

  const customer = await repository.upsertCustomerFromWhatsApp({
    phone,
    whatsappId: input.whatsappId ?? phone,
    name: input.profileName
  });
  const lookup = await repository.getOrCreateActiveConversation(customer.id);

  await repository.logMessage({
    conversationId: lookup.conversation.id,
    customerId: customer.id,
    direction: "inbound",
    provider: "twilio",
    providerMessageId: input.providerMessageId,
    body: sanitizeMessageBody(input.body),
    messageType: input.messageType,
    mediaUrl: input.mediaUrl,
    locationLat: input.locationLat,
    locationLng: input.locationLng,
    rawPayload: input.rawPayload
  });

  const result = await dependencies.flow.handle({
    customer,
    conversation: lookup.conversation,
    inbound: {
      ...input,
      body: sanitizeMessageBody(input.body),
      from: phone
    },
    isNewConversation: lookup.created
  });

  const conversation = result.conversationPatch
    ? await repository.updateConversation(lookup.conversation.id, result.conversationPatch)
    : lookup.conversation;

  for (const reply of result.replies) {
    const outbound = await dependencies.messenger.sendWhatsAppMessage(phone, reply);
    await repository.logMessage({
      conversationId: conversation.id,
      customerId: customer.id,
      direction: "outbound",
      provider: "twilio",
      providerMessageId: outbound.providerMessageId,
      body: reply,
      messageType: "text"
    });
  }

  if (result.audit) {
    await auditLogger.log({
      actor_type: "system",
      action: result.audit.action,
      entity_type: "conversation",
      entity_id: conversation.id,
      metadata: result.audit.metadata
    });
  }

  return {
    customer,
    conversation,
    replies: result.replies
  };
}

