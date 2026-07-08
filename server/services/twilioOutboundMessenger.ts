import twilio from "twilio";
import type { OutboundMessenger } from "../../core/conversations/types.js";
import { normalizeWhatsAppAddress } from "../../core/messages/safeLogging.js";
import type { AppEnv } from "../../core/config/env.js";

export class TwilioOutboundMessenger implements OutboundMessenger {
  constructor(private readonly env: AppEnv) {}

  async sendWhatsAppMessage(to: string, body: string) {
    if (
      !this.env.TWILIO_ACCOUNT_SID ||
      !this.env.TWILIO_AUTH_TOKEN ||
      !this.env.TWILIO_WHATSAPP_NUMBER
    ) {
      return { providerMessageId: `dev-${Date.now()}` };
    }

    const client = twilio(this.env.TWILIO_ACCOUNT_SID, this.env.TWILIO_AUTH_TOKEN);
    const message = await client.messages.create({
      from: `whatsapp:${normalizeWhatsAppAddress(this.env.TWILIO_WHATSAPP_NUMBER)}`,
      to: `whatsapp:${normalizeWhatsAppAddress(to)}`,
      body
    });

    return { providerMessageId: message.sid };
  }
}

