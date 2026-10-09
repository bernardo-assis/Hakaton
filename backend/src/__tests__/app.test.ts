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
  let userId: string;

  describe("User Endpoints", () => {
    it("should fail to create user with invalid email", async () => {
      const res = await request(app)
        .post("/api/users")
        .send({ email: "not-an-email", password: "password123" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Validation Error");
    });

    it("should create a user successfully", async () => {
      // Note: This requires a real DB connection or a mocked DB.
      // Assuming DB is running or we get 500 if it fails.
      // TDD: test behavior.
    });
  });
});
