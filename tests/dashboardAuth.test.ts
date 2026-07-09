import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";
import { hashPassword } from "../core/security/adminAuth.js";
import { createApp } from "../server/app.js";

const env = {
  NODE_ENV: "test",
  PORT: 3000,
  DATABASE_URL: "postgresql://user:password@localhost:5432/rugby_tyre",
  SESSION_SECRET: "test-session-secret-for-dashboard"
};

function userFixture(role: "owner" | "manager" | "staff" | "viewer", passwordHash: string) {
  return {
    id: `${role}-id`,
    name: `${role} user`,
    email: `${role}@example.com`,
    password_hash: passwordHash,
    role,
    active: true,
    created_at: new Date("2026-07-09T09:00:00Z"),
    updated_at: new Date("2026-07-09T09:00:00Z")
  };
}

function createMockPrisma(activeUser: ReturnType<typeof userFixture>) {
  const auditLogCreate = vi.fn(async () => ({ id: "audit-id" }));
  const customerCreate = vi.fn(async () => ({
    id: "customer-id",
    phone: "manual:rts-test",
    name: "Manual customer"
  }));
  const jobCreate = vi.fn(async (args) => ({
    id: "job-id",
    job_reference: "RTS-TEST",
    customer_id: "customer-id",
    conversation_id: null,
    assigned_user_id: args.data.assigned_user_id ?? null,
    vehicle_registration: args.data.vehicle_registration ?? null,
    tyre_size: args.data.tyre_size ?? null,
    tyre_description: args.data.tyre_description ?? null,
    tyre_brand: args.data.tyre_brand ?? null,
    stock_order_status: args.data.stock_order_status ?? "unknown",
    quantity: args.data.quantity ?? 1,
    fitter_name: args.data.fitter_name ?? null,
    job_type: args.data.job_type,
    source: args.data.source,
    status: args.data.status,
    service_required: args.data.service_required ?? null,
    issue_description: args.data.issue_description ?? null,
    address_text: args.data.address_text ?? null,
    location_lat: null,
    location_lng: null,
    location_source: null,
    preferred_date: args.data.preferred_date ?? null,
    preferred_time_text: args.data.preferred_time_text ?? null,
    scheduled_start: null,
    scheduled_end: null,
    urgency: args.data.urgency,
    cost: args.data.cost ?? null,
    price_estimate: args.data.price_estimate ?? null,
    payment_method: args.data.payment_method ?? "not_paid",
    payment_status: args.data.payment_status ?? "pending",
    notes: args.data.notes ?? null,
    internal_notes: args.data.internal_notes ?? null,
    customer_notes: args.data.customer_notes ?? null,
    cancellation_reason: null,
    reschedule_requested_text: null,
    completed_at: args.data.completed_at ?? null,
    created_at: new Date("2026-07-09T10:00:00Z"),
    updated_at: new Date("2026-07-09T10:00:00Z"),
    customer: { name: "Manual customer", phone: "manual:rts-test" }
  }));
  const tyreUpdate = vi.fn(async () => ({
    id: "tyre-id",
    size: "205/55/R16",
    width: 205,
    profile: 55,
    rim: 16,
    brand: "Budget",
    category: "Budget",
    price: 50,
    fitted_price: 72,
    availability_status: "available",
    quantity_available: 2,
    is_placeholder_seed_data: false,
    notes: null,
    active: true
  }));

  return {
    user: {
      findUnique: vi.fn(async (args) => {
        if (args.where.email === activeUser.email || args.where.id === activeUser.id) {
          return activeUser;
        }
        return null;
      }),
      findMany: vi.fn(async () => [activeUser]),
      create: vi.fn(async (args) => ({
        id: "created-user-id",
        ...args.data,
        created_at: new Date("2026-07-09T11:00:00Z"),
        updated_at: new Date("2026-07-09T11:00:00Z")
      })),
      update: vi.fn(async (args) => ({
        ...activeUser,
        ...args.data,
        id: args.where.id
      }))
    },
    customer: {
      create: customerCreate,
      update: vi.fn(),
      upsert: vi.fn()
    },
    job: {
      create: jobCreate,
      findMany: vi.fn(async () => []),
      findUnique: vi.fn(),
      update: vi.fn()
    },
    tyreCatalogue: {
      count: vi.fn(async () => 0),
      findMany: vi.fn(async () => []),
      create: vi.fn(),
      update: tyreUpdate
    },
    conversation: {
      count: vi.fn(async () => 0),
      findMany: vi.fn(async () => [])
    },
    conversationMessage: {
      findMany: vi.fn(async () => []),
      create: vi.fn()
    },
    auditLog: {
      create: auditLogCreate
    }
  };
}

async function loggedInAgent(role: "owner" | "manager" | "staff" | "viewer") {
  const passwordHash = await hashPassword("correct-password");
  const user = userFixture(role, passwordHash);
  const prisma = createMockPrisma(user);
  const app = createApp({ env, prisma: prisma as never });
  const agent = request.agent(app);

  await agent.post("/api/auth/login").send({
    email: user.email,
    password: "correct-password"
  });

  return { agent, prisma, user };
}

describe("dashboard staff authentication and roles", () => {
  it("requires a staff session for dashboard APIs", async () => {
    const passwordHash = await hashPassword("correct-password");
    const prisma = createMockPrisma(userFixture("owner", passwordHash));
    const app = createApp({ env, prisma: prisma as never });

    const response = await request(app).get("/api/dashboard/jobs");

    expect(response.status).toBe(401);
  });

  it("logs in with a valid staff user", async () => {
    const { agent } = await loggedInAgent("owner");

    const response = await agent.get("/api/auth/session");

    expect(response.status).toBe(200);
    expect(response.body.authenticated).toBe(true);
    expect(response.body.user.role).toBe("owner");
  });

  it("rejects an invalid password", async () => {
    const passwordHash = await hashPassword("correct-password");
    const user = userFixture("owner", passwordHash);
    const prisma = createMockPrisma(user);
    const app = createApp({ env, prisma: prisma as never });

    const response = await request(app).post("/api/auth/login").send({
      email: user.email,
      password: "wrong-password"
    });

    expect(response.status).toBe(401);
  });

  it("hashes passwords instead of storing plain text", async () => {
    const hash = await hashPassword("temporary-password");

    expect(hash).not.toBe("temporary-password");
    expect(await bcrypt.compare("temporary-password", hash)).toBe(true);
  });

  it("allows owner access to user management", async () => {
    const { agent } = await loggedInAgent("owner");

    const response = await agent.get("/api/dashboard/users");

    expect(response.status).toBe(200);
    expect(response.body[0].role).toBe("owner");
  });

  it("blocks staff from user management", async () => {
    const { agent } = await loggedInAgent("staff");

    const response = await agent.get("/api/dashboard/users");

    expect(response.status).toBe(403);
  });

  it("blocks viewer from creating jobs", async () => {
    const { agent } = await loggedInAgent("viewer");

    const response = await agent.post("/api/dashboard/jobs").send({
      job_type: "walk_in",
      source: "walk_in",
      status: "completed",
      tyre_description: "Puncture repair"
    });

    expect(response.status).toBe(403);
  });

  it("allows staff to create a completed job log entry and records the actor", async () => {
    const { agent, prisma, user } = await loggedInAgent("staff");

    const response = await agent.post("/api/dashboard/jobs").send({
      job_type: "walk_in",
      source: "walk_in",
      status: "completed",
      service_required: "Completed tyre service",
      tyre_description: "Puncture repair",
      stock_order_status: "stock",
      quantity: 1,
      payment_method: "card",
      payment_status: "paid"
    });

    expect(response.status).toBe(201);
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actor_type: "user",
          actor_id: user.id,
          action: "job.created_manual"
        })
      })
    );
  });

  it("allows manager to edit the tyre catalogue", async () => {
    const { agent } = await loggedInAgent("manager");

    const response = await agent.patch("/api/dashboard/tyres/tyre-id").send({
      fitted_price: 72
    });

    expect(response.status).toBe(200);
    expect(response.body.fitted_price).toBe(72);
  });
});
