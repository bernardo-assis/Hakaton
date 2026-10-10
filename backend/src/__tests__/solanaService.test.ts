const confirm = jest.fn();
jest.mock("@solana/web3.js", () => ({
  Connection: class {
    requestAirdrop() {
      return Promise.resolve("signature");
    }
    getLatestBlockhash() {
      return Promise.resolve({ blockhash: "block", lastValidBlockHeight: 10 });
    }
    confirmTransaction = confirm;
  },
  PublicKey: class {},
  LAMPORTS_PER_SOL: 1e9,
}));
import { SolanaService } from "../services/solanaService";
test("faucet rejects failed onchain confirmation", async () => {
  confirm.mockResolvedValue({
    value: { err: { InstructionError: [0, "failure"] } },
  });
  await expect(new SolanaService().requestAirdrop("key", 1)).rejects.toThrow(
    "Devnet faucet transaction failed",
  );
});
test("faucet returns signature after successful confirmation", async () => {
  confirm.mockResolvedValue({ value: { err: null } });
  await expect(new SolanaService().requestAirdrop("key", 1)).resolves.toBe(
    "signature",
  );
});
