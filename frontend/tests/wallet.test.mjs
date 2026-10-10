import test from "node:test";
import assert from "node:assert/strict";
import { connectWallet, disconnectWallet } from "../src/lib/wallet.ts";
test("wallet refuses a missing Phantom provider instead of pretending to connect", async () => {
  await assert.rejects(connectWallet(undefined), /Phantom/);
});
test("wallet connects with injected provider and disconnects explicitly", async () => {
  let disconnected = false;
  const provider = {
    isPhantom: true,
    connect: async () => ({ publicKey: { toString: () => "wallet-address" } }),
    disconnect: async () => {
      disconnected = true;
    },
  };
  assert.equal(await connectWallet(provider), "wallet-address");
  await disconnectWallet(provider);
  assert.equal(disconnected, true);
});
