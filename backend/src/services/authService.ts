import {
  createHash,
  createPublicKey,
  randomBytes,
  randomUUID,
  verify,
} from "crypto";
import { AuthRepository } from "../repositories/AuthRepository";
export const hash = (v: string) => createHash("sha256").update(v).digest("hex");
const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
export function decodeKey(value: string) {
  let n = 0n;
  for (const c of value) {
    const i = alphabet.indexOf(c);
    if (i < 0) throw new Error("Invalid wallet");
    n = n * 58n + BigInt(i);
  }
  let hex = n.toString(16);
  if (hex.length % 2) hex = "0" + hex;
  const bytes = n === 0n ? Buffer.alloc(0) : Buffer.from(hex, "hex");
  const leading = value.match(/^1*/)?.[0].length ?? 0;
  const result = Buffer.concat([Buffer.alloc(leading), bytes]);
  if (result.length !== 32) throw new Error("Invalid wallet");
  return result;
}
export class AuthService {
  constructor(private repo = new AuthRepository()) {}
  async challenge(pubkey: string, origin: string, browser: string) {
    decodeKey(pubkey);
    const id = randomUUID(),
      expires = new Date(Date.now() + 5 * 60 * 1000);
    const message = `AgentSafe wallet authentication\nOrigin: ${origin}\nWallet: ${pubkey}\nNonce: ${randomBytes(32).toString("hex")}\nIssued at: ${new Date().toISOString()}\nExpires at: ${expires.toISOString()}\nNetwork: Solana Devnet (authentication only)\nPurpose: Sign in only. This signature does not authorize payments.`;
    await this.repo.challenge({
      id,
      pubkey,
      origin,
      browser_hash: hash(browser),
      message,
      expires,
    });
    return { challenge_id: id, message, expires_at: expires.toISOString() };
  }
  async verify(id: string, signature: string, origin: string, browser: string) {
    const token = randomBytes(32).toString("base64url");
    const result = await this.repo.consume(
      id,
      origin,
      hash(browser),
      async (row) => {
        const key = createPublicKey({
          format: "der",
          type: "spki",
          key: Buffer.concat([
            Buffer.from("302a300506032b6570032100", "hex"),
            decodeKey(row.owner_pubkey),
          ]),
        });
        return verify(
          null,
          Buffer.from(row.message, "utf8"),
          key,
          Buffer.from(signature, "base64"),
        );
      },
      hash(token),
    );
    return { token, ...result };
  }
  session(token: string) {
    return this.repo.session(hash(token));
  }
  logout(token: string) {
    return this.repo.logout(hash(token));
  }
}
