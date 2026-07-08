import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

const COOKIE_NAME = "rts_admin_session";
const loginSchema = z.object({
  password: z.string().min(1)
});

export function createSessionToken(secret: string): string {
  const issuedAt = Date.now().toString();
  const signature = crypto.createHmac("sha256", secret).update(issuedAt).digest("hex");
  return `${issuedAt}.${signature}`;
}

export function isValidSessionToken(token: string | undefined, secret: string): boolean {
  if (!token) {
    return false;
  }

  const [issuedAt, signature] = token.split(".");
  if (!issuedAt || !signature) {
    return false;
  }

  const expected = crypto.createHmac("sha256", secret).update(issuedAt).digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const signatureBuffer = Buffer.from(signature, "hex");

  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}

export function adminAuthMiddleware(secret: string, adminPassword: string | undefined) {
  return function requireAdmin(req: Request, res: Response, next: NextFunction) {
    if (!adminPassword) {
      res.status(503).json({ error: "ADMIN_PASSWORD is not configured" });
      return;
    }

    if (!isValidSessionToken(req.cookies?.[COOKIE_NAME], secret)) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    next();
  };
}

export function loginHandler(secret: string, adminPassword: string | undefined) {
  return function login(req: Request, res: Response) {
    if (!adminPassword) {
      res.status(503).json({ error: "ADMIN_PASSWORD is not configured" });
      return;
    }

    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success || parsed.data.password !== adminPassword) {
      res.status(401).json({ error: "Invalid password" });
      return;
    }

    res.cookie(COOKIE_NAME, createSessionToken(secret), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 12
    });
    res.json({ ok: true });
  };
}

export function logoutHandler(_req: Request, res: Response) {
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
}

export function sessionHandler(secret: string, adminPassword: string | undefined) {
  return function session(req: Request, res: Response) {
    res.json({
      authenticated: Boolean(adminPassword) && isValidSessionToken(req.cookies?.[COOKIE_NAME], secret)
    });
  };
}

