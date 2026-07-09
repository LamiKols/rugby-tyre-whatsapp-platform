import { Router } from "express";
import type { PrismaClient } from "@prisma/client";
import {
  loginHandler,
  logoutHandler,
  sessionHandler
} from "../../core/security/adminAuth.js";
import type { AppEnv } from "../../core/config/env.js";

export function createAuthRoutes(env: AppEnv, prisma: PrismaClient) {
  const router = Router();
  const secret = env.SESSION_SECRET ?? "dev-session-secret-change-before-production";

  router.post("/login", loginHandler(secret, env.ADMIN_PASSWORD, prisma));
  router.post("/logout", logoutHandler);
  router.get("/session", sessionHandler(secret, env.ADMIN_PASSWORD, prisma));

  return router;
}
