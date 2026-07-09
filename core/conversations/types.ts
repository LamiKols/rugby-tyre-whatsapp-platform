export interface CustomerRecord {
  id: string;
  phone: string;
  whatsapp_id?: string | null;
  name?: string | null;
}

export interface ConversationRecord {
  id: string;
  customer_id: string;
  channel: string;
  status: string;
  current_intent?: string | null;
  current_state: string;
  failed_attempts: number;
  state_data?: Record<string, unknown> | null;
  handoff_required: boolean;
  handoff_reason?: string | null;
}

export interface ConversationLookupResult {
  conversation: ConversationRecord;
  created: boolean;
}

export interface IncomingWhatsAppMessage {
  from: string;
  whatsappId?: string;
  profileName?: string;
  body: string;
  providerMessageId?: string;
  messageType: string;
  mediaUrl?: string;
  locationLat?: number;
  locationLng?: number;
  rawPayload: Record<string, unknown>;
}

export interface OutboundMessageResult {
  providerMessageId?: string;
}

export interface OutboundMessenger {
  sendWhatsAppMessage(to: string, body: string): Promise<OutboundMessageResult>;
}

export interface ConversationPatch {
  status?: string;
  current_intent?: string | null;
  current_state?: string;
  failed_attempts?: number;
  state_data?: Record<string, unknown> | null;
  handoff_required?: boolean;
  handoff_reason?: string | null;
}

export interface ConversationRepository {
  upsertCustomerFromWhatsApp(input: {
    phone: string;
    whatsappId?: string;
    name?: string;
  }): Promise<CustomerRecord>;
  getOrCreateActiveConversation(customerId: string): Promise<ConversationLookupResult>;
  updateConversation(conversationId: string, patch: ConversationPatch): Promise<ConversationRecord>;
  logMessage(input: {
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
  }): Promise<void>;
}

export interface ConversationFlowContext {
  customer: CustomerRecord;
  conversation: ConversationRecord;
  inbound: IncomingWhatsAppMessage;
  isNewConversation: boolean;
}

export interface ConversationFlowResult {
  replies: string[];
  conversationPatch?: ConversationPatch;
  audit?: {
    action: string;
    metadata?: Record<string, unknown>;
  };
}

export interface ConversationFlow {
  handle(context: ConversationFlowContext): Promise<ConversationFlowResult>;
}
