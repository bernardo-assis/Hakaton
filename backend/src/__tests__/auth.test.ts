jest.mock("@solana/web3.js", () => ({
  Connection: class {
    getBalance() {
      return Promise.reject(new Error("offline"));
    }
  },
  PublicKey: class {
    constructor(private v: string) {}
    toBase58() {
      return this.v;
    }
  },
  LAMPORTS_PER_SOL: 1e9,
}));
import request from "supertest";
import app from "../app";
import pool from "../db/database";
import { generateKeyPairSync, sign } from "crypto";
const origin = "http://localhost:5173";
const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function encode(b: Buffer) {
  let n = BigInt("0x" + b.toString("hex")),
    s = "";
  while (n) {
    s = alphabet[Number(n % 58n)] + s;
    n /= 58n;
  }
  for (const x of b) {
    if (x) break;
    s = "1" + s;
  }
  return s;
}
export function wallet() {
  const k = generateKeyPairSync("ed25519");
  return {
    ...k,
    pubkey: encode(
      k.publicKey.export({ format: "der", type: "spki" }).subarray(-32),
    ),
  };
}
const keys = [wallet(), wallet()];
function post(path: string, body: any, cookie?: string) {
  const r = request(app)
    .post(path)
    .set("Origin", origin)
    .set("X-AgentSafe-CSRF", "1");
  if (cookie) r.set("Cookie", cookie);
  return r.send(body);
}
async function login(k = keys[0]) {
  const challenge = await post("/api/auth/challenge", {
    owner_pubkey: k.pubkey,
  });
  expect(challenge.status).toBe(200);
  const d = challenge.body.data;
  const signature = sign(null, Buffer.from(d.message), k.privateKey).toString(
    "base64",
  );
  const browser = challenge.headers["set-cookie"][0].split(";")[0];
  const v = await post(
    "/api/auth/verify",
    { challenge_id: d.challenge_id, signature },
    browser,
  );
  expect(v.status).toBe(200);
  return {
    cookie: v.headers["set-cookie"][0].split(";")[0],
    d,
    signature,
    browser,
  };
}
afterAll(async () => {
  for (const k of keys) {
    const identity = (
      await pool.query(
        "SELECT user_id FROM wallet_identities WHERE owner_pubkey=$1",
        [k.pubkey],
      )
    ).rows[0];
    if (identity) {
      await pool.query(
        "DELETE FROM audit_events WHERE vault_id IN(SELECT id FROM vaults WHERE user_id=$1)",
        [identity.user_id],
      );
      await pool.query(
        "DELETE FROM whitelist_recipients WHERE agent_id IN(SELECT a.id FROM agents a JOIN vaults v ON v.id=a.vault_id WHERE v.user_id=$1)",
        [identity.user_id],
      );
      await pool.query(
        "DELETE FROM transactions WHERE agent_id IN(SELECT a.id FROM agents a JOIN vaults v ON v.id=a.vault_id WHERE v.user_id=$1)",
        [identity.user_id],
      );
      await pool.query(
        "DELETE FROM agents WHERE vault_id IN(SELECT id FROM vaults WHERE user_id=$1)",
        [identity.user_id],
      );
      await pool.query("DELETE FROM vaults WHERE user_id=$1", [
        identity.user_id,
      ]);
      await pool.query("DELETE FROM auth_sessions WHERE user_id=$1", [
        identity.user_id,
      ]);
      await pool.query("DELETE FROM wallet_identities WHERE user_id=$1", [
        identity.user_id,
      ]);
      await pool.query("DELETE FROM users WHERE id=$1", [identity.user_id]);
    }
    await pool.query("DELETE FROM wallet_challenges WHERE owner_pubkey=$1", [
      k.pubkey,
    ]);
  }
  await pool.end();
});
test("anonymous session is false and private data requires login", async () => {
  expect((await request(app).get("/api/auth/session")).body.data).toEqual({
    authenticated: false,
  });
  for (const path of [
    "/api/dashboard",
    "/api/vaults",
    "/api/agents",
    "/api/notifications",
    "/api/simulator/history",
  ])
    expect((await request(app).get(path)).status).toBe(401);
});
test("signature login is durable, replay prevented and logout revokes", async () => {
  const { cookie, d, signature, browser } = await login();
  expect(
    (await request(app).get("/api/auth/session").set("Cookie", cookie)).body
      .data.owner_pubkey,
  ).toBe(keys[0].pubkey);
  expect(
    (
      await post(
        "/api/auth/verify",
        { challenge_id: d.challenge_id, signature },
        browser,
      )
    ).status,
  ).toBe(401);
  expect((await post("/api/auth/logout", {}, cookie)).status).toBe(200);
  expect(
    (await request(app).get("/api/auth/session").set("Cookie", cookie)).body
      .data.authenticated,
  ).toBe(false);
});
test("bad origins, missing CSRF, wrong signatures and expired nonce are rejected", async () => {
  expect(
    (
      await request(app)
        .post("/api/auth/challenge")
        .send({ owner_pubkey: keys[0].pubkey })
    ).status,
  ).toBe(403);
  expect(
    (
      await request(app)
        .post("/api/auth/challenge")
        .set("Origin", "https://evil.invalid")
        .set("X-AgentSafe-CSRF", "1")
        .send({ owner_pubkey: keys[0].pubkey })
    ).status,
  ).toBe(403);
  const challenge = await post("/api/auth/challenge", {
    owner_pubkey: keys[0].pubkey,
  });
  const d = challenge.body.data;
  const browser = challenge.headers["set-cookie"][0].split(";")[0];
  expect(
    (
      await post(
        "/api/auth/verify",
        {
          challenge_id: d.challenge_id,
          signature: sign(
            null,
            Buffer.from(d.message),
            keys[1].privateKey,
          ).toString("base64"),
        },
        browser,
      )
    ).status,
  ).toBe(401);
  await pool.query(
    "UPDATE wallet_challenges SET expires_at=NOW()-INTERVAL '1 second' WHERE id=$1",
    [d.challenge_id],
  );
  expect(
    (
      await post(
        "/api/auth/verify",
        {
          challenge_id: d.challenge_id,
          signature: sign(
            null,
            Buffer.from(d.message),
            keys[0].privateKey,
          ).toString("base64"),
        },
        browser,
      )
    ).status,
  ).toBe(401);
});
test("concurrent nonce consumption permits one session only", async () => {
  const challenge = await post("/api/auth/challenge", {
    owner_pubkey: keys[0].pubkey,
  });
  const d = challenge.body.data;
  const browser = challenge.headers["set-cookie"][0].split(";")[0];
  const body = {
    challenge_id: d.challenge_id,
    signature: sign(null, Buffer.from(d.message), keys[0].privateKey).toString(
      "base64",
    ),
  };
  expect(
    (
      await Promise.all([
        post("/api/auth/verify", body, browser),
        post("/api/auth/verify", body, browser),
      ])
    )
      .map((r) => r.status)
      .sort(),
  ).toEqual([200, 401]);
});
test("two owners cannot read or mutate each other records", async () => {
  const a = await login(keys[0]),
    b = await login(keys[1]);
  const va = (
    await post("/api/vaults/local", { owner_pubkey: keys[0].pubkey }, a.cookie)
  ).body.data;
  const vb = (
    await post("/api/vaults/local", { owner_pubkey: keys[1].pubkey }, b.cookie)
  ).body.data;
  expect(va.id).not.toBe(vb.id);
  expect(
    (
      await request(app).get("/api/vaults").set("Cookie", b.cookie)
    ).body.data.map((v: any) => v.id),
  ).toEqual([vb.id]);
  const patch = await request(app)
    .patch("/api/vaults/" + va.id)
    .set("Cookie", b.cookie)
    .set("Origin", origin)
    .set("X-AgentSafe-CSRF", "1")
    .send({ status: "FROZEN" });
  expect(patch.status).toBe(404);
  expect(
    (
      await post(
        "/api/vaults/local",
        { owner_pubkey: keys[0].pubkey },
        b.cookie,
      )
    ).status,
  ).toBe(403);
});
test("browser binding rejects another cookie and expired sessions cannot access data", async () => {
  const challenge = await post("/api/auth/challenge", {
    owner_pubkey: keys[0].pubkey,
  });
  const d = challenge.body.data;
  const body = {
    challenge_id: d.challenge_id,
    signature: sign(null, Buffer.from(d.message), keys[0].privateKey).toString(
      "base64",
    ),
  };
  expect((await post("/api/auth/verify", body)).status).toBe(401);
  expect(
    (
      await post(
        "/api/auth/verify",
        body,
        "agentsafe_login=" + Buffer.alloc(32, 1).toString("base64url"),
      )
    ).status,
  ).toBe(401);
  const success = await post(
    "/api/auth/verify",
    body,
    challenge.headers["set-cookie"][0].split(";")[0],
  );
  expect(success.status).toBe(200);
  const cookie = success.headers["set-cookie"][0].split(";")[0];
  const token = cookie.split("=")[1];
  await pool.query(
    "UPDATE auth_sessions SET expires_at=NOW()-INTERVAL '1 second' WHERE token_hash=$1",
    [require("crypto").createHash("sha256").update(token).digest("hex")],
  );
  expect(
    (await request(app).get("/api/auth/session").set("Cookie", cookie)).body
      .data.authenticated,
  ).toBe(false);
  expect(
    (await request(app).get("/api/dashboard").set("Cookie", cookie)).status,
  ).toBe(401);
});
test("all app resources enforce owner scope including tainted legacy shared user rows", async () => {
  const a = await login(keys[0]),
    b = await login(keys[1]);
  const va = (
    await post("/api/vaults/local", { owner_pubkey: keys[0].pubkey }, a.cookie)
  ).body.data;
  const vb = (
    await post("/api/vaults/local", { owner_pubkey: keys[1].pubkey }, b.cookie)
  ).body.data;
  const aa = (
    await post(
      "/api/agents",
      {
        vault_id: va.id,
        name: "Owner A",
        role: "test",
        agent_pubkey: keys[0].pubkey,
        daily_cap_lamports: "10",
        single_tx_cap_lamports: "10",
      },
      a.cookie,
    )
  ).body.data;
  const ab = (
    await post(
      "/api/agents",
      {
        vault_id: vb.id,
        name: "Owner B",
        role: "test",
        agent_pubkey: keys[1].pubkey,
        daily_cap_lamports: "10",
        single_tx_cap_lamports: "10",
      },
      b.cookie,
    )
  ).body.data;
  expect(aa.id).toBeDefined();
  expect(ab.id).toBeDefined();
  const policies = {
    pause_on_low_balance: false,
    low_balance_threshold_lamports: "0",
    require_human_approval: false,
    approval_threshold_lamports: "0",
    block_unlisted_recipients: false,
  };
  const patch = (path: string, body: any) =>
    request(app)
      .patch(path)
      .set("Cookie", b.cookie)
      .set("Origin", origin)
      .set("X-AgentSafe-CSRF", "1")
      .send(body);
  expect((await patch("/api/agents/" + aa.id, { name: "Stolen" })).status).toBe(
    404,
  );
  expect(
    (await patch("/api/agents/" + aa.id + "/whitelist", { recipients: [] }))
      .status,
  ).toBe(404);
  expect(
    (await patch("/api/vaults/" + va.id + "/policies", policies)).status,
  ).toBe(404);
  expect(
    (await post("/api/vaults/" + va.id + "/optimize", {}, b.cookie)).status,
  ).toBe(404);
  expect(
    (
      await post(
        "/api/dashboard/deposit",
        { vault_id: va.id, amountSol: 1 },
        b.cookie,
      )
    ).status,
  ).toBe(404);
  expect(
    (
      await request(app)
        .get("/api/agents/" + aa.id + "/history")
        .set("Cookie", b.cookie)
    ).status,
  ).toBe(404);
  expect(
    (
      await post(
        "/api/agents",
        {
          vault_id: va.id,
          name: "Stolen",
          role: "test",
          agent_pubkey: keys[1].pubkey,
          daily_cap_lamports: "10",
        },
        b.cookie,
      )
    ).status,
  ).toBe(404);
  expect(
    (
      await post(
        "/api/simulator/evaluate",
        {
          agent_id: aa.id,
          amount_lamports: "1",
          recipient_pubkey: keys[0].pubkey,
          request_id: "cross",
        },
        b.cookie,
      )
    ).status,
  ).toBe(404);
  const sim = await post(
    "/api/simulator/evaluate",
    {
      agent_id: aa.id,
      amount_lamports: "1",
      recipient_pubkey: keys[0].pubkey,
      request_id: "own",
    },
    a.cookie,
  );
  expect(sim.status).toBe(200);
  await pool.query(
    "INSERT INTO transactions(agent_id,idempotency_key,request_hash,recipient_pubkey,amount_lamports,decision,settlement_status,error_code) VALUES($1,'fixture','hash',$2,1,'BLOCKED','NOT_SUBMITTED','TEST')",
    [aa.id, keys[0].pubkey],
  );
  const tainted = (
    await pool.query(
      "INSERT INTO vaults(user_id,owner_pubkey,vault_pubkey,key_reference) VALUES($1,$2,$2,'tainted-legacy') RETURNING id",
      [va.user_id, keys[1].pubkey],
    )
  ).rows[0];
  const ownVaults = (
    await request(app).get("/api/vaults").set("Cookie", a.cookie)
  ).body.data;
  expect(ownVaults.some((v: any) => v.id === tainted.id)).toBe(false);
  const agents = (await request(app).get("/api/agents").set("Cookie", b.cookie))
    .body.data;
  expect(agents.map((v: any) => v.id)).toEqual([ab.id]);
  expect(
    (await request(app).get("/api/simulator/history").set("Cookie", b.cookie))
      .body.data,
  ).toEqual([]);
  expect(
    (await request(app).get("/api/notifications").set("Cookie", b.cookie)).body
      .data,
  ).toEqual([]);
  const dashboard = (
    await request(app).get("/api/dashboard").set("Cookie", b.cookie)
  ).body.data;
  expect(dashboard.totalAgents).toBe(1);
  expect(dashboard.blockedTxs).toBe(0);
  expect(dashboard.transactions).toEqual([]);
  expect(
    dashboard.chartData.every((v: any) => v.approved === 0 && v.blocked === 0),
  ).toBe(true);
  expect((await post("/api/agents/panic", {}, a.cookie)).body.data.count).toBe(
    1,
  );
  expect(
    (await request(app).get("/api/agents").set("Cookie", b.cookie)).body.data[0]
      .status,
  ).toBe("ACTIVE");
  expect(
    (
      await post(
        "/api/users",
        { email: "x@y.com", password: "password123" },
        b.cookie,
      )
    ).status,
  ).toBe(501);
  expect(
    (
      await post(
        "/api/vaults",
        { user_id: va.user_id, owner_pubkey: keys[0].pubkey },
        b.cookie,
      )
    ).status,
  ).toBe(501);
  expect((await post("/api/transactions", {}, b.cookie)).status).toBe(501);
  expect((await post("/api/dashboard/withdraw", {}, b.cookie)).status).toBe(
    501,
  );
  await pool.query("DELETE FROM transactions WHERE agent_id=$1", [aa.id]);
});
