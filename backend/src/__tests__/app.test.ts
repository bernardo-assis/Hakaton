jest.mock("@solana/web3.js", () => ({
  Connection: class {},
  PublicKey: class {},
}));
import request from "supertest";
import app from "../app";
import pool from "../db/database";
afterAll(async () => {
  await pool.end();
});

describe("App API Endpoints", () => {
  describe("User Endpoints", () => {
    it("rejects legacy account mutation without origin and CSRF", async () => {
      const res = await request(app)
        .post("/api/users")
        .send({ email: "not-an-email", password: "password123" });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Allowed Origin and CSRF header required");
    });
  });
});
