import path from "node:path";
import { fileURLToPath } from "node:url";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import type { PrismaClient } from "@prisma/client";
import type { AppEnv } from "../core/config/env.js";
import { getHealth } from "../core/health/healthService.js";
import { prisma as defaultPrisma } from "../core/db/prisma.js";
import { createAuthRoutes } from "./routes/authRoutes.js";
import { createDashboardRoutes } from "./routes/dashboardRoutes.js";
import { createTwilioWebhookRoutes } from "./routes/twilioWebhookRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface CreateAppOptions {
  env: AppEnv;
  prisma?: PrismaClient;
}

export function createApp(options: CreateAppOptions) {
  const app = express();
  const prisma = options.prisma ?? defaultPrisma;

  app.set("trust proxy", true);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: true, credentials: true }));
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json(getHealth(options.env.DATABASE_URL));
  });

  app.use("/api/auth", createAuthRoutes(options.env));
  app.use("/api/dashboard", createDashboardRoutes(options.env, prisma));
  app.use("/webhooks/twilio", createTwilioWebhookRoutes(options.env, prisma));

  const dashboardDist = path.resolve(__dirname, "../dist-dashboard");
  app.use(express.static(dashboardDist));

  const dashboardPages = [
    "/dashboard",
    "/dashboard/conversations",
    "/dashboard/customers",
    "/dashboard/tyres",
    "/dashboard/handoffs",
    "/dashboard/settings"
  ];

  for (const page of dashboardPages) {
    app.get(page, (_req, res) => {
      res.sendFile(path.join(dashboardDist, "index.html"), (error) => {
        if (error) {
          res
            .status(200)
            .send("Dashboard frontend is not built yet. Run npm run build:dashboard, then start the server.");
        }
      });
    });
  }

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}

