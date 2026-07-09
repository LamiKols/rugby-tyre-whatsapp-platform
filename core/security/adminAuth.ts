import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import type { NextFunction, Request, Response } from "express";
import type { PrismaClient } from "@prisma/client";
import { z } from "zod";

const COOKIE_NAME = "rts_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;

export const staffRoles = ["owner", "manager", "staff", "viewer"] as const;
export type StaffRole = (typeof staffRoles)[number];

export const permissions = [
  "dashboard:read",
  "jobs:write",
  "quotes:write",
  "tyres:write",
  "customers:read",
  "conversations:read",
  "handoffs:write",
  "settings:manage",
  "users:manage"
] as const;
export type Permission = (typeof permissions)[number];

const rolePermissions: Record<StaffRole, Permission[]> = {
  owner: [...permissions],
  manager: [
    "dashboard:read",
    "jobs:write",
    "quotes:write",
    "tyres:write",
    "customers:read",
    "conversations:read",
    "handoffs:write"
  ],
  staff: ["dashboard:read", "jobs:write", "quotes:write", "conversations:read", "handoffs:write"],
  viewer: ["dashboard:read"]
};

const loginSchema = z.object({
  email: z.string().trim().email().optional(),
  password: z.string().min(1)
});

interface SessionPayload {
  userId?: string;
  fallbackAdmin?: boolean;
  issuedAt: number;
}

export interface AuthenticatedStaffUser {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  fallbackAdmin?: boolean;
}

export interface AuthenticatedRequest extends Request {
  staffUser?: AuthenticatedStaffUser;
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

export function createSessionToken(payloadOrSecret: SessionPayload | string, maybeSecret?: string): string {
  if (typeof payloadOrSecret === "string") {
    const issuedAt = Date.now().toString();
    const signature = sign(issuedAt, payloadOrSecret);
    return `${issuedAt}.${signature}`;
  }

  if (!maybeSecret) {
    throw new Error("Session secret is required");
  }

  const payload = base64UrlEncode(JSON.stringify(payloadOrSecret));
  return `${payload}.${sign(payload, maybeSecret)}`;
}

export function createStaffSessionToken(userId: string, secret: string): string {
  return createSessionToken({ userId, issuedAt: Date.now() }, secret);
}

function createFallbackAdminSessionToken(secret: string): string {
  return createSessionToken({ fallbackAdmin: true, issuedAt: Date.now() }, secret);
}

function verifySignedPayload(token: string | undefined, secret: string): SessionPayload | null {
  if (!token) {
    return null;
  }

  const [payload, signature] = token.split(".");
  if (!payload || !signature) {
    return null;
  }

  const expected = sign(payload, secret);
  const expectedBuffer = Buffer.from(expected, "hex");
  const signatureBuffer = Buffer.from(signature, "hex");

  if (expectedBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) {
    return null;
  }

  try {
    const parsed = JSON.parse(base64UrlDecode(payload)) as SessionPayload;
    if (!parsed.issuedAt || Date.now() - parsed.issuedAt > SESSION_TTL_MS) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function isValidSessionToken(token: string | undefined, secret: string): boolean {
  if (!token) {
    return false;
  }

  const payload = verifySignedPayload(token, secret);
  if (payload) {
    return true;
  }

  const [issuedAt, signature] = token.split(".");
  if (!issuedAt || !signature) {
    return false;
  }

  const expected = sign(issuedAt, secret);
  const expectedBuffer = Buffer.from(expected, "hex");
  const signatureBuffer = Buffer.from(signature, "hex");

  return expectedBuffer.length === signatureBuffer.length && crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function hasPermission(user: AuthenticatedStaffUser | undefined, permission: Permission): boolean {
  if (!user) {
    return false;
  }

  return rolePermissions[user.role]?.includes(permission) ?? false;
}

function fallbackAdminUser(): AuthenticatedStaffUser {
  return {
    id: "fallback-admin",
    name: "Temporary admin",
    email: "admin-password-fallback@rugbytyreservices.local",
    role: "owner",
    fallbackAdmin: true
  };
}

async function resolveSessionUser(
  prisma: PrismaClient,
  token: string | undefined,
  secret: string
): Promise<AuthenticatedStaffUser | null> {
  const payload = verifySignedPayload(token, secret);
  if (!payload) {
    return null;
  }

  if (payload.fallbackAdmin) {
    return fallbackAdminUser();
  }

  if (!payload.userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, name: true, email: true, role: true, active: true }
  });

  if (!user?.active || !staffRoles.includes(user.role as StaffRole)) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as StaffRole
  };
}

export function adminAuthMiddleware(secret: string, adminPassword: string | undefined, prisma: PrismaClient) {
  return async function requireStaffLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await resolveSessionUser(prisma, req.cookies?.[COOKIE_NAME], secret);
      if (!user) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      (req as AuthenticatedRequest).staffUser = user;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requirePermission(permission: Permission) {
  return function requireStaffPermission(req: Request, res: Response, next: NextFunction) {
    const user = (req as AuthenticatedRequest).staffUser;
    if (!hasPermission(user, permission)) {
      res.status(403).json({ error: "You do not have permission to perform this action" });
      return;
    }

    next();
  };
}

export function auditActor(req: Request) {
  const user = (req as AuthenticatedRequest).staffUser;

  return {
    actor_type: user?.fallbackAdmin ? "admin_fallback" : "user",
    actor_id: user?.fallbackAdmin ? undefined : user?.id
  };
}

function setSessionCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_MS
  });
}

export function loginHandler(secret: string, adminPassword: string | undefined, prisma: PrismaClient) {
  return async function login(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      if (parsed.data.email) {
        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
          select: { id: true, password_hash: true, active: true }
        });

        if (!user?.active || !user.password_hash || !(await verifyPassword(parsed.data.password, user.password_hash))) {
          res.status(401).json({ error: "Invalid email or password" });
          return;
        }

        setSessionCookie(res, createStaffSessionToken(user.id, secret));
        res.json({ ok: true });
        return;
      }

      if (adminPassword && parsed.data.password === adminPassword) {
        setSessionCookie(res, createFallbackAdminSessionToken(secret));
        res.json({ ok: true, deprecatedFallback: true });
        return;
      }

      res.status(401).json({ error: "Invalid email or password" });
    } catch (error) {
      next(error);
    }
  };
}

export function logoutHandler(_req: Request, res: Response) {
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
}

export function sessionHandler(secret: string, _adminPassword: string | undefined, prisma: PrismaClient) {
  return async function session(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await resolveSessionUser(prisma, req.cookies?.[COOKIE_NAME], secret);
      res.json({
        authenticated: Boolean(user),
        user
      });
    } catch (error) {
      next(error);
    }
  };
}
