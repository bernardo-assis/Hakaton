import request from "supertest";
import { generateKeyPairSync, sign } from "crypto";
import app from "../app";
export const origin = "http://localhost:5173";
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
export async function login(k = wallet()) {
  const challenge = await request(app)
    .post("/api/auth/challenge")
    .set("Origin", origin)
    .set("X-AgentSafe-CSRF", "1")
    .send({ owner_pubkey: k.pubkey });
  if (challenge.status !== 200) throw new Error(JSON.stringify(challenge.body));
  const browser = challenge.headers["set-cookie"][0].split(";")[0];
  const d = challenge.body.data;
  const signature = sign(null, Buffer.from(d.message), k.privateKey).toString(
    "base64",
  );
  const response = await request(app)
    .post("/api/auth/verify")
    .set("Origin", origin)
    .set("X-AgentSafe-CSRF", "1")
    .set("Cookie", browser)
    .send({ challenge_id: d.challenge_id, signature });
  if (response.status !== 200) throw new Error(JSON.stringify(response.body));
  return {
    cookie: response.headers["set-cookie"][0].split(";")[0],
    browser,
    d,
    signature,
    pubkey: k.pubkey,
  };
}
