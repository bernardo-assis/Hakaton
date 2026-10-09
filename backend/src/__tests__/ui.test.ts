jest.mock("@solana/web3.js", () => ({
  Connection: class {
    getBalance() {
      return Promise.reject(new Error("offline"));
    }
  },
  PublicKey: class {
    constructor(private value: string) {}
    toBase58() {
      return this.value;
    }
  },
  LAMPORTS_PER_SOL: 1000000000,
}));
import request from "supertest";
import app from "../app";
import pool from "../db/database";
const fixtureWallet =
  "Test" + require("crypto").randomBytes(20).toString("hex").slice(0, 36);
afterAll(async () => {
  const v = (
    await pool.query("SELECT id,user_id FROM vaults WHERE vault_pubkey=$1", [
      fixtureWallet,
    ])
  ).rows[0];
  if (v) {
    await pool.query("DELETE FROM audit_events WHERE vault_id=$1", [v.id]);
    await pool.query(
      "DELETE FROM whitelist_recipients WHERE agent_id IN (SELECT id FROM agents WHERE vault_id=$1)",
      [v.id],
    );
    await pool.query("DELETE FROM agents WHERE vault_id=$1", [v.id]);
    await pool.query("DELETE FROM vaults WHERE id=$1", [v.id]);
    await pool.query("DELETE FROM users WHERE id=$1", [v.user_id]);
  }
  await pool.end();
});
test("real transfer endpoint never submits without authenticated authorization", async () => {
  const res = await request(app).post("/api/transactions").send({});
  expect(res.status).toBe(501);
});
test("vault listing is available", async () => {
  const res = await request(app).get("/api/vaults");
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body.data)).toBe(true);
});
test("dashboard supplies complete empty-state stats", async () => {
  const res = await request(app).get("/api/dashboard");
  expect(res.status).toBe(200);
  expect(typeof res.body.data.activeAgents).toBe("number");
  expect(res.body.data.chartData).toHaveLength(7);
});
test("simulator rejects invalid money and unknown input", async () => {
  const res = await request(app)
    .post("/api/simulator/evaluate")
    .send({ amount_lamports: -1, unknown: true });
  expect(res.status).toBe(400);
});
test("local wallet onboarding does not require a custody secret", async () => {
  const r = await request(app)
    .post("/api/vaults/local")
    .send({ owner_pubkey: fixtureWallet });
  expect(r.status).toBe(200);
  expect(r.body.data.owner_pubkey).toBe(fixtureWallet);
  expect(r.body.data.key_reference).toBeUndefined();
});
test("concurrent simulations respect shared daily limit and replay safely", async () => {
  const vault = (
    await request(app)
      .post("/api/vaults/local")
      .send({ owner_pubkey: fixtureWallet })
  ).body.data;
  const agent = (
    await request(app)
      .post("/api/agents")
      .send({
        vault_id: vault.id,
        name: "Integration " + Date.now(),
        role: "Test",
        agent_pubkey: "11111111111111111111111111111111",
        daily_cap_lamports: "10",
        single_tx_cap_lamports: "10",
      })
  ).body.data;
  const payload = {
    agent_id: agent.id,
    amount_lamports: "7",
    recipient_pubkey: "11111111111111111111111111111111",
  };
  const responses = await Promise.all(
    ["one", "two"].map((request_id) =>
      request(app)
        .post("/api/simulator/evaluate")
        .send({ ...payload, request_id }),
    ),
  );
  expect(responses.map((r) => r.body.data.decision).sort()).toEqual([
    "APPROVED",
    "BLOCKED",
  ]);
  const replay = await request(app)
    .post("/api/simulator/evaluate")
    .send({ ...payload, request_id: "one" });
  expect(replay.body.data.id).toBe(responses[0].body.data.id);
  const conflict = await request(app)
    .post("/api/simulator/evaluate")
    .send({ ...payload, amount_lamports: "6", request_id: "one" });
  expect(conflict.status).toBe(409);
  await pool.query(
    `INSERT INTO audit_events(vault_id,actor_id,action,target_id,after_state) SELECT $1,$2,'SIMULATION',$2,jsonb_build_object('result',jsonb_build_object('decision','APPROVED','amount_lamports','1')) FROM generate_series(1,101)`,
    [vault.id, agent.id],
  );
  const agents = (await request(app).get("/api/agents")).body.data;
  expect(
    agents.find((a: any) => a.id === agent.id).simulated_spent_today_lamports,
  ).toBe("108");
  const changed = await request(app)
    .patch("/api/agents/" + agent.id)
    .send({ daily_cap_lamports: "20" });
  expect(changed.status).toBe(200);
  const audit = (
    await pool.query(
      "SELECT before_state,after_state FROM audit_events WHERE target_id=$1 AND action='AGENTS_UPDATED' ORDER BY created_at DESC LIMIT 1",
      [agent.id],
    )
  ).rows[0];
  expect(audit.before_state.daily_cap_lamports).toBe("10");
  expect(audit.after_state.daily_cap_lamports).toBe("20");
  expect(audit.after_state.key_reference).toBeUndefined();
  const freeze = await request(app)
    .patch("/api/agents/" + agent.id)
    .send({ status: "FROZEN" });
  expect(freeze.status).toBe(200);
  const stopped = await request(app)
    .post("/api/simulator/evaluate")
    .send({ ...payload, request_id: "three" });
  expect(stopped.body.data.reason).toBe("AGENT_FROZEN");
  const whitelist = await request(app)
    .patch("/api/agents/" + agent.id + "/whitelist")
    .send({
      recipients: [
        { recipient_pubkey: payload.recipient_pubkey, label: "Allowed" },
      ],
    });
  expect(whitelist.status).toBe(200);
  await pool.query("DELETE FROM audit_events WHERE target_id=$1", [agent.id]);
  await pool.query("DELETE FROM whitelist_recipients WHERE agent_id=$1", [
    agent.id,
  ]);
  await pool.query("DELETE FROM agents WHERE id=$1", [agent.id]);
});

test("faucet rejects fractional lamports", async () => {
  const r = await request(app)
    .post("/api/dashboard/deposit")
    .send({ amountSol: 0.0000000001 });
  expect(r.status).toBe(400);
});
