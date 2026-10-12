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
import rawRequest from "supertest";
import { wallet, login, origin } from "../testUtils/walletSession";
import app from "../app";
import pool from "../db/database";
const fixture = wallet();
const fixtureWallet = fixture.pubkey;
let sessionCookie = "";
beforeAll(async () => {
  sessionCookie = (await login(fixture)).cookie;
});
function request(_: typeof app) {
  const base = rawRequest(app);
  return {
    get: (p: string) => base.get(p).set("Cookie", sessionCookie),
    post: (p: string) =>
      base
        .post(p)
        .set("Cookie", sessionCookie)
        .set("Origin", origin)
        .set("X-AgentSafe-CSRF", "1"),
    patch: (p: string) =>
      base
        .patch(p)
        .set("Cookie", sessionCookie)
        .set("Origin", origin)
        .set("X-AgentSafe-CSRF", "1"),
  };
}
afterAll(async () => {
  const v = (
    await pool.query("SELECT id,user_id FROM vaults WHERE vault_pubkey=$1", [
      fixtureWallet,
    ])
  ).rows[0];
  if (v) {
    await pool.query(
      "DELETE FROM audit_events WHERE vault_id IN (SELECT id FROM vaults WHERE user_id=$1)",
      [v.user_id],
    );
    await pool.query(
      "DELETE FROM whitelist_recipients WHERE agent_id IN (SELECT id FROM agents WHERE vault_id IN (SELECT id FROM vaults WHERE user_id=$1))",
      [v.user_id],
    );
    await pool.query(
      "DELETE FROM agents WHERE vault_id IN (SELECT id FROM vaults WHERE user_id=$1)",
      [v.user_id],
    );
    await pool.query("DELETE FROM vaults WHERE user_id=$1", [v.user_id]);
    await pool.query("DELETE FROM auth_sessions WHERE user_id=$1", [v.user_id]);
    await pool.query("DELETE FROM wallet_identities WHERE user_id=$1", [
      v.user_id,
    ]);
    await pool.query("DELETE FROM users WHERE id=$1", [v.user_id]);
  }
  await pool.query("DELETE FROM wallet_challenges WHERE owner_pubkey=$1", [
    fixtureWallet,
  ]);
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

test("agent can be moved between owned vaults and prevents IDOR on unowned vaults", async () => {
  const vault1 = (
    await request(app)
      .post("/api/vaults/local")
      .send({ owner_pubkey: fixtureWallet })
  ).body.data;

  // Create second vault for the same owner/user
  const vault2 = (
    await pool.query(
      "INSERT INTO vaults(user_id, owner_pubkey, vault_pubkey, key_reference) VALUES($1, $2, $3, $4) RETURNING *",
      [vault1.user_id, fixtureWallet, "22222222222222222222222222222222", "external-wallet:22222222222222222222222222222222"],
    )
  ).rows[0];

  const agent = (
    await request(app)
      .post("/api/agents")
      .send({
        vault_id: vault1.id,
        name: "Moveable Agent",
        role: "Worker",
        agent_pubkey: "33333333333333333333333333333333",
        daily_cap_lamports: "100",
        single_tx_cap_lamports: "50",
      })
  ).body.data;

  // Attempt IDOR: move agent to unowned vault
  const idorRes = await request(app)
    .patch(`/api/agents/${agent.id}`)
    .send({ vault_id: "00000000-0000-0000-0000-000000000000" });
  expect(idorRes.status).toBe(404);

  // Successfully move agent to owned vault2
  const moveRes = await request(app)
    .patch(`/api/agents/${agent.id}`)
    .send({ vault_id: vault2.id });
  expect(moveRes.status).toBe(200);
  expect(moveRes.body.data.vault_id).toBe(vault2.id);

  // Verify audit event records vault_id change
  const audit = (
    await pool.query(
      "SELECT before_state, after_state FROM audit_events WHERE target_id=$1 AND action='AGENTS_UPDATED' ORDER BY created_at DESC LIMIT 1",
      [agent.id],
    )
  ).rows[0];
  expect(audit.before_state.vault_id).toBe(vault1.id);
  expect(audit.after_state.vault_id).toBe(vault2.id);

  // Cleanup
  await pool.query(
    "DELETE FROM audit_events WHERE target_id=$1 OR vault_id=$2",
    [agent.id, vault2.id],
  );
  await pool.query("DELETE FROM agents WHERE id=$1", [agent.id]);
  await pool.query("DELETE FROM vaults WHERE id=$1", [vault2.id]);
});

test("dashboard stats reflect simulation events in blocked count and chart data", async () => {
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
        name: "Sim Stats Agent",
        role: "Analyst",
        agent_pubkey: "44444444444444444444444444444444",
        daily_cap_lamports: "100",
        single_tx_cap_lamports: "50",
      })
  ).body.data;

  const beforeDash = (await request(app).get("/api/dashboard")).body.data;
  const beforeBlocked = beforeDash.blockedTxs;

  // Insert a BLOCKED simulation audit event
  await pool.query(
    `INSERT INTO audit_events(vault_id, actor_id, action, target_id, after_state, created_at)
     VALUES($1, $2, 'SIMULATION', $3, jsonb_build_object('result', jsonb_build_object('decision', 'BLOCKED', 'amount_lamports', '10')), NOW())`,
    [vault.id, fixtureWallet, agent.id],
  );

  // Insert an APPROVED simulation audit event
  await pool.query(
    `INSERT INTO audit_events(vault_id, actor_id, action, target_id, after_state, created_at)
     VALUES($1, $2, 'SIMULATION', $3, jsonb_build_object('result', jsonb_build_object('decision', 'APPROVED', 'amount_lamports', '10')), NOW())`,
    [vault.id, fixtureWallet, agent.id],
  );

  const afterDash = (await request(app).get("/api/dashboard")).body.data;
  expect(afterDash.blockedTxs).toBe(beforeBlocked + 1);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayChart = afterDash.chartData.find((c: any) => c.date === todayStr);
  expect(todayChart).toBeDefined();
  expect(todayChart.approved).toBeGreaterThanOrEqual(1);
  expect(todayChart.blocked).toBeGreaterThanOrEqual(1);

  // Cleanup
  await pool.query("DELETE FROM audit_events WHERE target_id=$1", [agent.id]);
  await pool.query("DELETE FROM agents WHERE id=$1", [agent.id]);
});
