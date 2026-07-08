const MAX_MESSAGE_LENGTH = 4000;

export function normalizeWhatsAppAddress(value: string): string {
  return value.replace(/^whatsapp:/i, "").trim();
}

export function sanitizeMessageBody(body: unknown): string {
  if (typeof body !== "string") {
    return "";
  }

  return body.trim().slice(0, MAX_MESSAGE_LENGTH);
}

export function safeRawPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const blockedKeys = new Set(["AccountSid", "AuthToken", "ApiVersion"]);

  return Object.fromEntries(
    Object.entries(payload).filter(([key]) => !blockedKeys.has(key))
  );
}

