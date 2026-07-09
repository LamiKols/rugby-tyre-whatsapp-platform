import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../server/app.js";

describe("dashboard API protection", () => {
  it("requires an admin session for dashboard APIs", async () => {
    const app = createApp({
      env: {
        NODE_ENV: "test",
        PORT: 3000,
        DATABASE_URL: "postgresql://user:password@localhost:5432/rugby_tyre",
        SESSION_SECRET: "test-session-secret-for-dashboard",
        ADMIN_PASSWORD: "secret"
      }
    });

    const response = await request(app).get("/api/dashboard/jobs");

    expect(response.status).toBe(401);
  });
});

