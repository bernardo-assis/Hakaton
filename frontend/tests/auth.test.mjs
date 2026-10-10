import test from "node:test";
import assert from "node:assert/strict";
import { authenticateWallet, IdentityGeneration } from "../src/lib/authFlow.ts";
import { request, setIdentityGeneration } from "../src/lib/api.ts";

test("auth signs exact server UTF8 bytes and verifies canonical base64 with cookies", async () => {
  const address = "signed-owner";
  const message = "AgentSafe\nAutenticação — não transfere fundos.\nNonce: one";
  let signedBytes;
  const signature = new Uint8Array(64).fill(7);
  const provider = {
    isPhantom: true,
    publicKey: { toString: () => address },
    connect: async () => ({ publicKey: { toString: () => address } }),
    signMessage: async (bytes) => {
      signedBytes = bytes;
      return { signature, publicKey: { toString: () => address } };
    },
  };
  const calls = [];
  const client = async (path, options = {}) => {
    calls.push({ path, options });
    if (path === "/auth/challenge")
      return {
        challenge_id: "challenge",
        message,
        expires_at: new Date(Date.now() + 60000).toISOString(),
      };
    if (path === "/auth/verify")
      return { authenticated: true, owner_pubkey: address };
    return {
      authenticated: true,
      owner_pubkey: address,
      expires_at: new Date(Date.now() + 60000).toISOString(),
    };
  };
  const result = await authenticateWallet(provider, client);
  assert.equal(result.owner_pubkey, address);
  assert.deepEqual(signedBytes, new TextEncoder().encode(message));
  assert.deepEqual(JSON.parse(calls[1].options.body), {
    challenge_id: "challenge",
    signature: Buffer.from(signature).toString("base64"),
  });
});

test("signature rejection never verifies and stale account change cannot publish authentication", async () => {
  let verified = 0;
  const generation = new IdentityGeneration();
  const current = generation.current;
  const provider = {
    isPhantom: true,
    publicKey: { toString: () => "owner" },
    connect: async () => ({ publicKey: { toString: () => "owner" } }),
    signMessage: async () => {
      generation.advance();
      return {
        signature: new Uint8Array(64),
        publicKey: { toString: () => "owner" },
      };
    },
  };
  const client = async (path) => {
    if (path === "/auth/verify") verified++;
    return {
      challenge_id: "one",
      message: "canonical",
      expires_at: new Date(Date.now() + 60000).toISOString(),
    };
  };
  await assert.rejects(
    authenticateWallet(provider, client, () => generation.isCurrent(current)),
    /carteira|interromp/i,
  );
  assert.equal(verified, 0);
  provider.signMessage = async () => {
    throw new Error("User rejected signature");
  };
  await assert.rejects(authenticateWallet(provider, client), /rejected/);
  assert.equal(verified, 0);
});

test("API sends same-origin cookies and CSRF header; unauthorized events retain request generation", async () => {
  const original = globalThis.fetch;
  const originalWindow = globalThis.window;
  const originalCustomEvent = globalThis.CustomEvent;
  let sent, event;
  globalThis.window = {
    dispatchEvent: (value) => {
      event = value;
    },
  };
  globalThis.CustomEvent = class {
    constructor(type, options) {
      this.type = type;
      this.detail = options.detail;
    }
  };
  globalThis.fetch = async (_url, options) => {
    sent = options;
    setIdentityGeneration(12);
    return new Response(
      JSON.stringify({ success: false, error: "Login required" }),
      { status: 401 },
    );
  };
  try {
    setIdentityGeneration(11);
    await assert.rejects(
      request("/agents", { method: "POST", body: "{}" }),
      (error) => error.status === 401,
    );
    assert.equal(sent.credentials, "same-origin");
    assert.equal(sent.headers["X-AgentSafe-CSRF"], "1");
    assert.equal(event.type, "agentsafe:unauthorized");
    assert.equal(event.detail.generation, 11);
  } finally {
    globalThis.fetch = original;
    globalThis.window = originalWindow;
    globalThis.CustomEvent = originalCustomEvent;
    setIdentityGeneration(0);
  }
});
