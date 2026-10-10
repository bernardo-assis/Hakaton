import test from "node:test";
import assert from "node:assert/strict";
import { request, sol, usagePercent } from "../src/lib/api.ts";

test("API reads backend data through relative /api and rejects backend errors", async () => {
  let url;
  const original = globalThis.fetch;
  globalThis.fetch = async (input) => {
    url = input;
    return new Response(
      JSON.stringify({ success: true, data: { balance: 2 } }),
    );
  };
  try {
    assert.deepEqual(await request("/dashboard"), { balance: 2 });
    assert.equal(url, "/api/dashboard");
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ success: false, error: "Vault frozen" }), {
        status: 409,
      });
    await assert.rejects(request("/dashboard"), /Vault frozen/);
  } finally {
    globalThis.fetch = original;
  }
});

test("SOL formatting and budget meter never invent dollar value or overflow", () => {
  assert.equal(sol(1.25), "1.25 SOL");
  assert.equal(usagePercent(6, 5), 100);
  assert.equal(usagePercent(3, 0), 0);
});

test("currency conversion rejects fractional lamports and negative values", async () => {
  const { toLamports } = await import("../src/lib/api.ts");
  assert.equal(toLamports("0.000000001"), "1");
  assert.equal(toLamports("2.5"), "2500000000");
  assert.throws(() => toLamports("0.0000000001"), /SOL/);
  assert.throws(() => toLamports("-1"), /SOL/);
});
