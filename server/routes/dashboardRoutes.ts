import { Router } from "express";
import { z } from "zod";
import type { PrismaClient } from "@prisma/client";
import type { AppEnv } from "../../core/config/env.js";
import { getHealth } from "../../core/health/healthService.js";
import { adminAuthMiddleware } from "../../core/security/adminAuth.js";
import { idParamSchema, paginationQuerySchema } from "../../core/validation/common.js";
import { normalizeTyreSize, parseTyreSize } from "../../modules/tyres/tyreSize.js";
import { PrismaAuditLogger } from "../repositories/prismaAuditLogger.js";
import { PrismaTyreCatalogueRepository } from "../repositories/prismaTyreCatalogueRepository.js";
import { createDashboardJobRoutes } from "./dashboardJobRoutes.js";
import { createDashboardQuoteRoutes } from "./dashboardQuoteRoutes.js";

const tyreInputSchema = z.object({
  size: z.string().min(1),
  brand: z.string().min(1),
  category: z.string().min(1),
  price: z.coerce.number().nonnegative(),
  fitted_price: z.coerce.number().nonnegative(),
  availability_status: z.string().min(1).default("available"),
  quantity_available: z.coerce.number().int().nonnegative().nullable().optional(),
  is_placeholder_seed_data: z.coerce.boolean().default(false),
  notes: z.string().nullable().optional(),
  active: z.coerce.boolean().default(true)
});

function serializeMessage(message: {
  id: string;
  direction: string;
  body: string | null;
  message_type: string;
  media_url: string | null;
  created_at: Date;
}) {
  return {
    id: message.id,
    direction: message.direction,
    body: message.body,
    messageType: message.message_type,
    mediaUrl: message.media_url,
    createdAt: message.created_at.toISOString()
  };
}

export function createDashboardRoutes(env: AppEnv, prisma: PrismaClient) {
  const router = Router();
  const secret = env.SESSION_SECRET ?? "dev-session-secret-change-before-production";
  const requireAdmin = adminAuthMiddleware(secret, env.ADMIN_PASSWORD);
  const tyreRepository = new PrismaTyreCatalogueRepository(prisma);
  const auditLogger = new PrismaAuditLogger(prisma);

  router.use(requireAdmin);
  router.use("/jobs", createDashboardJobRoutes(env, prisma, auditLogger));
  router.use("/quotes", createDashboardQuoteRoutes(prisma, auditLogger));

  router.get("/summary", async (_req, res, next) => {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const tomorrowStart = new Date(todayStart);
      tomorrowStart.setDate(tomorrowStart.getDate() + 1);

      const [recentConversations, handoffCount, customerCount, tyreCount, recentMessages, jobCounts] =
        await Promise.all([
          prisma.conversation.findMany({
            take: 5,
            orderBy: { updated_at: "desc" },
            include: {
              customer: true,
              messages: { take: 1, orderBy: { created_at: "desc" } }
            }
          }),
          prisma.conversation.count({ where: { handoff_required: true } }),
          prisma.customer.count(),
          prisma.tyreCatalogue.count({ where: { active: true } }),
          prisma.conversationMessage.findMany({
            take: 6,
            orderBy: { created_at: "desc" },
            include: { customer: true }
          }),
          Promise.all([
            prisma.job.count({
              where: {
                OR: [
                  { scheduled_start: { gte: todayStart, lt: tomorrowStart } },
                  { preferred_date: { gte: todayStart, lt: tomorrowStart } }
                ],
                status: { notIn: ["cancelled", "completed", "paid", "no_show"] }
              }
            }),
            prisma.job.count({
              where: { source: "whatsapp", status: "awaiting_owner_confirmation" }
            }),
            prisma.job.count({
              where: {
                urgency: "emergency",
                status: { notIn: ["cancelled", "completed", "paid", "no_show"] }
              }
            }),
            prisma.job.count({ where: { status: "reschedule_requested" } }),
            prisma.job.count({ where: { status: "cancellation_requested" } }),
            prisma.job.count({
              where: {
                OR: [
                  { status: "payment_pending" },
                  { payment_status: { in: ["pending", "part_paid"] } }
                ]
              }
            })
          ])
        ]);

      res.json({
        cards: {
          recentConversations: recentConversations.length,
          handoffsRequiringAttention: handoffCount,
          knownCustomers: customerCount,
          tyreCatalogueItems: tyreCount,
          jobsToday: jobCounts[0],
          pendingWhatsAppRequests: jobCounts[1],
          emergencyJobs: jobCounts[2],
          rescheduleRequests: jobCounts[3],
          cancellationRequests: jobCounts[4],
          paymentPending: jobCounts[5],
          systemHealth: getHealth(env.DATABASE_URL)
        },
        recentActivity: recentMessages.map((message) => ({
          id: message.id,
          customer: message.customer.name ?? message.customer.phone,
          direction: message.direction,
          body: message.body,
          createdAt: message.created_at.toISOString()
        }))
      });
    } catch (error) {
      next(error);
    }
  });

  router.get("/conversations", async (_req, res, next) => {
    try {
      const conversations = await prisma.conversation.findMany({
        orderBy: { updated_at: "desc" },
        include: {
          customer: true,
          messages: { take: 1, orderBy: { created_at: "desc" } }
        }
      });

      res.json(
        conversations.map((conversation) => ({
          id: conversation.id,
          customerName: conversation.customer.name,
          customerPhone: conversation.customer.phone,
          lastMessage: conversation.messages[0]?.body ?? "",
          status: conversation.status,
          currentIntent: conversation.current_intent,
          currentState: conversation.current_state,
          handoffRequired: conversation.handoff_required,
          handoffReason: conversation.handoff_reason,
          updatedAt: conversation.updated_at.toISOString()
        }))
      );
    } catch (error) {
      next(error);
    }
  });

  router.get("/conversations/:id", async (req, res, next) => {
    try {
      const parsed = idParamSchema.safeParse(req.params);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid conversation id" });
        return;
      }

      const conversation = await prisma.conversation.findUnique({
        where: { id: parsed.data.id },
        include: {
          customer: true,
          messages: { orderBy: { created_at: "asc" } }
        }
      });

      if (!conversation) {
        res.status(404).json({ error: "Conversation not found" });
        return;
      }

      res.json({
        id: conversation.id,
        customer: {
          id: conversation.customer.id,
          name: conversation.customer.name,
          phone: conversation.customer.phone
        },
        status: conversation.status,
        currentIntent: conversation.current_intent,
        currentState: conversation.current_state,
        handoffRequired: conversation.handoff_required,
        handoffReason: conversation.handoff_reason,
        messages: conversation.messages.map(serializeMessage)
      });
    } catch (error) {
      next(error);
    }
  });

  router.get("/customers", async (_req, res, next) => {
    try {
      const customers = await prisma.customer.findMany({
        orderBy: { last_seen_at: "desc" },
        include: { _count: { select: { conversations: true } } }
      });

      res.json(
        customers.map((customer) => ({
          id: customer.id,
          name: customer.name,
          whatsappPhone: customer.phone,
          vehicleRegistration: null,
          firstSeenAt: customer.first_seen_at.toISOString(),
          lastSeenAt: customer.last_seen_at.toISOString(),
          conversationCount: customer._count.conversations
        }))
      );
    } catch (error) {
      next(error);
    }
  });

  router.get("/tyres", async (req, res, next) => {
    try {
      const parsed = paginationQuerySchema.safeParse(req.query);
      const tyres = await tyreRepository.list(parsed.success ? parsed.data.search : undefined);
      res.json(tyres);
    } catch (error) {
      next(error);
    }
  });

  router.post("/tyres", async (req, res, next) => {
    try {
      const parsed = tyreInputSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
      }

      const parsedSize = parseTyreSize(parsed.data.size);
      if (!parsedSize) {
        res.status(400).json({ error: "Invalid tyre size" });
        return;
      }

      const tyre = await tyreRepository.create({
        ...parsed.data,
        size: parsedSize.canonical,
        width: parsedSize.width,
        profile: parsedSize.profile,
        rim: parsedSize.rim
      });

      await auditLogger.log({
        actor_type: "admin",
        action: "tyre_catalogue.created",
        entity_type: "tyre_catalogue",
        entity_id: tyre.id,
        metadata: { size: tyre.size, brand: tyre.brand }
      });

      res.status(201).json(tyre);
    } catch (error) {
      next(error);
    }
  });

  router.patch("/tyres/:id", async (req, res, next) => {
    try {
      const params = idParamSchema.safeParse(req.params);
      const parsed = tyreInputSchema.partial().safeParse(req.body);
      if (!params.success || !parsed.success) {
        res.status(400).json({ error: "Invalid tyre update" });
        return;
      }

      const sizePatch = parsed.data.size ? normalizeTyreSize(parsed.data.size) : undefined;
      if (parsed.data.size && !sizePatch) {
        res.status(400).json({ error: "Invalid tyre size" });
        return;
      }

      const tyre = await tyreRepository.update(params.data.id, {
        ...parsed.data,
        ...(sizePatch
          ? {
              size: sizePatch,
              width: parseTyreSize(sizePatch)?.width,
              profile: parseTyreSize(sizePatch)?.profile,
              rim: parseTyreSize(sizePatch)?.rim
            }
          : {})
      });

      await auditLogger.log({
        actor_type: "admin",
        action: "tyre_catalogue.updated",
        entity_type: "tyre_catalogue",
        entity_id: tyre.id,
        metadata: { size: tyre.size, brand: tyre.brand }
      });

      res.json(tyre);
    } catch (error) {
      next(error);
    }
  });

  router.get("/handoffs", async (_req, res, next) => {
    try {
      const handoffs = await prisma.conversation.findMany({
        where: { handoff_required: true },
        orderBy: { updated_at: "desc" },
        include: {
          customer: true,
          messages: { take: 1, orderBy: { created_at: "desc" } }
        }
      });

      res.json(
        handoffs.map((conversation) => ({
          id: conversation.id,
          customer: conversation.customer.name ?? conversation.customer.phone,
          phone: conversation.customer.phone,
          reason: conversation.handoff_reason,
          lastMessage: conversation.messages[0]?.body ?? "",
          suggestedNextAction: "Reply to the customer directly in WhatsApp, then mark this handoff as resolved.",
          updatedAt: conversation.updated_at.toISOString()
        }))
      );
    } catch (error) {
      next(error);
    }
  });

  router.patch("/handoffs/:id/resolve", async (req, res, next) => {
    try {
      const parsed = idParamSchema.safeParse(req.params);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid handoff id" });
        return;
      }

      const conversation = await prisma.conversation.update({
        where: { id: parsed.data.id },
        data: {
          status: "active",
          current_state: "menu",
          handoff_required: false,
          handoff_reason: null,
          failed_attempts: 0
        }
      });

      await auditLogger.log({
        actor_type: "admin",
        action: "handoff.resolved",
        entity_type: "conversation",
        entity_id: conversation.id
      });

      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  router.get("/settings", (_req, res) => {
    res.json({
      phase: "placeholder",
      futureSettings: [
        "Opening hours",
        "Booking capacity",
        "Bank details",
        "WhatsApp templates",
        "Mobile callout settings",
        "Admin users",
        "Shop address",
        "Emergency wording",
        "Privacy/data retention settings"
      ]
    });
  });

  return router;
}
