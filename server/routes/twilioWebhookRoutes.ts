import { Router } from "express";
import type { Request } from "express";
import type { AppEnv } from "../../core/config/env.js";
import { handleIncomingWhatsAppMessage } from "../../core/conversations/whatsappMessageHandler.js";
import { safeRawPayload, sanitizeMessageBody } from "../../core/messages/safeLogging.js";
import { webhookRateLimit } from "../../core/security/rateLimit.js";
import { verifyTwilioSignature } from "../../core/security/twilioSignature.js";
import { TyreConversationFlow } from "../../modules/tyres/tyreConversationFlow.js";
import { PrismaAuditLogger } from "../repositories/prismaAuditLogger.js";
import { PrismaConversationRepository } from "../repositories/prismaConversationRepository.js";
import { PrismaTyreCatalogueRepository } from "../repositories/prismaTyreCatalogueRepository.js";
import { TwilioOutboundMessenger } from "../services/twilioOutboundMessenger.js";
import type { PrismaClient } from "@prisma/client";

function webhookUrl(req: Request): string {
  return `${req.protocol}://${req.get("host")}${req.originalUrl}`;
}

function twilioParams(body: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(body).map(([key, value]) => [key, typeof value === "string" ? value : String(value ?? "")])
  );
}

export function createTwilioWebhookRoutes(env: AppEnv, prisma: PrismaClient) {
  const router = Router();
  const conversationRepository = new PrismaConversationRepository(prisma);
  const tyreRepository = new PrismaTyreCatalogueRepository(prisma);
  const flow = new TyreConversationFlow(tyreRepository);
  const messenger = new TwilioOutboundMessenger(env);
  const auditLogger = new PrismaAuditLogger(prisma);

  router.post("/whatsapp", webhookRateLimit, async (req, res, next) => {
    try {
      const shouldVerify = Boolean(env.TWILIO_AUTH_TOKEN || env.TWILIO_WEBHOOK_SECRET);
      if (shouldVerify) {
        const valid = verifyTwilioSignature({
          authToken: env.TWILIO_AUTH_TOKEN,
          webhookSecret: env.TWILIO_WEBHOOK_SECRET,
          signature: req.header("X-Twilio-Signature"),
          url: webhookUrl(req),
          params: twilioParams(req.body)
        });

        if (!valid) {
          res.status(403).send("Invalid Twilio signature");
          return;
        }
      } else if (env.NODE_ENV === "production") {
        res.status(503).send("Twilio signing secret is not configured");
        return;
      }

      const rawPayload = safeRawPayload(req.body as Record<string, unknown>);
      await handleIncomingWhatsAppMessage(
        {
          from: String(req.body.From ?? ""),
          whatsappId: String(req.body.WaId ?? req.body.From ?? ""),
          profileName: typeof req.body.ProfileName === "string" ? req.body.ProfileName : undefined,
          body: sanitizeMessageBody(req.body.Body),
          providerMessageId: typeof req.body.MessageSid === "string" ? req.body.MessageSid : undefined,
          messageType: typeof req.body.MessageType === "string" ? req.body.MessageType : "text",
          mediaUrl: typeof req.body.MediaUrl0 === "string" ? req.body.MediaUrl0 : undefined,
          locationLat: req.body.Latitude ? Number(req.body.Latitude) : undefined,
          locationLng: req.body.Longitude ? Number(req.body.Longitude) : undefined,
          rawPayload
        },
        {
          repository: conversationRepository,
          flow,
          messenger,
          auditLogger
        }
      );

      res.type("text/xml").send("<Response></Response>");
    } catch (error) {
      next(error);
    }
  });

  return router;
}

