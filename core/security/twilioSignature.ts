import twilio from "twilio";

export interface TwilioSignatureInput {
  authToken?: string;
  webhookSecret?: string;
  signature?: string;
  url: string;
  params: Record<string, string>;
}

export function verifyTwilioSignature(input: TwilioSignatureInput): boolean {
  const signingSecret = input.webhookSecret || input.authToken;

  if (!signingSecret || !input.signature) {
    return false;
  }

  try {
    return twilio.validateRequest(signingSecret, input.signature, input.url, input.params);
  } catch {
    return false;
  }
}

