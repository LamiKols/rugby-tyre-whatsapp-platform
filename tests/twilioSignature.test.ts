import { describe, expect, it } from "vitest";
import { verifyTwilioSignature } from "../core/security/twilioSignature.js";

describe("Twilio webhook signature verification", () => {
  it("rejects invalid signatures", () => {
    expect(
      verifyTwilioSignature({
        authToken: "test-secret",
        signature: "definitely-not-valid",
        url: "https://example.com/webhooks/twilio/whatsapp",
        params: {
          From: "whatsapp:+447700900000",
          Body: "Hi"
        }
      })
    ).toBe(false);
  });
});

