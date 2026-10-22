import {
  afterAll,
  beforeAll,
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import request from "supertest";
import type { Application } from "express";
import { createApp } from "../src/app";
import { startDatabase } from "./helpers";
import type { Database } from "../src/lib/types";

describe("app", () => {
  let app: Application;
  let database: Awaited<ReturnType<typeof startDatabase>>;
  let db: Database;

  beforeAll(async () => {
    database = await startDatabase();
    db = database.db;
    app = await createApp(db);
  });

  afterAll(async () => {
    await database.stop();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return status of 200 on /health GET request", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("should return 404 for a non-existent route", async () => {
    const res = await request(app).get("/nope");

    expect(res.status).toBe(404);
  });

  it("should return an error when the listings limit exceeds the maximum", async () => {
    const query = `
      query {
        listings(
          filter: PRICE_LOW_TO_HIGH
          limit: 100
          page: 1
        ) {
          total
          result {
            id
          }
        }
      }
    `;

    const res = await request(app).post("/api").send({ query });

    expect(res.status).toBe(200);
    expect(res.body.errors?.[0]?.message).toContain(
      "Limit must be between 1 and 50",
    );
  });

  it("should return 200 when the database is ready", async () => {
    const res = await request(app).get("/ready");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ready" });
  });

  it("should return 503 when the database is unavailable", async () => {
    vi.spyOn(db, "ping").mockRejectedValueOnce(
      new Error("Database unavailable"),
    );

    const res = await request(app).get("/ready");

    expect(res.status).toBe(503);
    expect(res.body).toEqual({ status: "not ready" });
  });
});
