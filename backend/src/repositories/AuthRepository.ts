import pool, { query } from "../db/database";
export class AuthRepository {
  async challenge(v: any) {
    await query(
      "INSERT INTO wallet_challenges(id,owner_pubkey,message,origin,browser_hash,expires_at) VALUES($1,$2,$3,$4,$5,$6)",
      [v.id, v.pubkey, v.message, v.origin, v.browser_hash, v.expires],
    );
  }
  async consume(
    id: string,
    origin: string,
    browserHash: string,
    check: (row: any) => Promise<boolean>,
    tokenHash: string,
  ) {
    const c = await pool.connect();
    try {
      await c.query("BEGIN");
      const row = (
        await c.query(
          "SELECT * FROM wallet_challenges WHERE id=$1 FOR UPDATE",
          [id],
        )
      ).rows[0];
      if (
        !row ||
        row.consumed_at ||
        new Date(row.expires_at).getTime() <= Date.now() ||
        row.origin !== origin ||
        row.browser_hash !== browserHash ||
        !(await check(row))
      )
        throw Object.assign(new Error("Invalid or expired wallet challenge"), {
          status: 401,
        });
      await c.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
        row.owner_pubkey,
      ]);
      let identity = (
        await c.query(
          "SELECT user_id FROM wallet_identities WHERE owner_pubkey=$1",
          [row.owner_pubkey],
        )
      ).rows[0];
      if (!identity) {
        const legacy = (
          await c.query(
            "SELECT u.id FROM users u WHERE u.email=$1 AND u.password_hash='LOCAL_WALLET_NO_LOGIN' AND EXISTS(SELECT 1 FROM vaults v WHERE v.user_id=u.id AND v.owner_pubkey=$2 AND v.vault_pubkey=$2 AND v.key_reference=$3) AND NOT EXISTS(SELECT 1 FROM wallet_identities WHERE user_id=u.id)",
            [
              row.owner_pubkey + "@local.invalid",
              row.owner_pubkey,
              "external-wallet:" + row.owner_pubkey,
            ],
          )
        ).rows[0];
        const user =
          legacy ??
          (
            await c.query(
              "INSERT INTO users(email,password_hash,company_name) VALUES($1,'WALLET_AUTH_NO_PASSWORD','Wallet identity') RETURNING id",
              ["wallet-" + require("crypto").randomUUID() + "@auth.invalid"],
            )
          ).rows[0];
        identity = { user_id: user.id };
        await c.query(
          "INSERT INTO wallet_identities(owner_pubkey,user_id) VALUES($1,$2)",
          [row.owner_pubkey, user.id],
        );
      }
      await c.query(
        "UPDATE wallet_challenges SET consumed_at=NOW() WHERE id=$1",
        [id],
      );
      const expiry = (
        await c.query(
          "INSERT INTO auth_sessions(token_hash,user_id,owner_pubkey,expires_at) VALUES($1,$2,$3,NOW()+INTERVAL '8 hours') RETURNING expires_at",
          [tokenHash, identity.user_id, row.owner_pubkey],
        )
      ).rows[0].expires_at;
      await c.query("COMMIT");
      return {
        user_id: identity.user_id,
        owner_pubkey: row.owner_pubkey,
        expires_at: expiry,
      };
    } catch (e) {
      await c.query("ROLLBACK");
      throw e;
    } finally {
      c.release();
    }
  }
  async session(hash: string) {
    return (
      (
        await query(
          "SELECT user_id,owner_pubkey,expires_at FROM auth_sessions WHERE token_hash=$1 AND revoked_at IS NULL AND expires_at>NOW()",
          [hash],
        )
      ).rows[0] ?? null
    );
  }
  async logout(hash: string) {
    await query(
      "UPDATE auth_sessions SET revoked_at=NOW() WHERE token_hash=$1",
      [hash],
    );
  }
}
