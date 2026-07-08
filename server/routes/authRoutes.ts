import { Router } from "express";
import {
  loginHandler,
  logoutHandler,
  sessionHandler
} from "../../core/security/adminAuth.js";
import type { AppEnv } from "../../core/config/env.js";

export function createAuthRoutes(env: AppEnv) {
  const router = Router();
  const secret = env.SESSION_SECRET ?? "dev-session-secret-change-before-production";

  router.post("/login", loginHandler(secret, env.ADMIN_PASSWORD));
  router.post("/logout", logoutHandler);
  router.get("/session", sessionHandler(secret, env.ADMIN_PASSWORD));

  return router;
}

