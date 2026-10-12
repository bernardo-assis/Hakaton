import pool, { query } from "../db/database";
export class UiRepository {
  constructor(private identity = { user_id: "", owner_pubkey: "" }) {}
  private get scope() {
    return [this.identity.user_id, this.identity.owner_pubkey];
  }
  private async lockVault(c: import('pg').PoolClient, kind: 'vaults'|'agents', id: string) {
    const row = (await c.query(kind === 'vaults'
      ? 'SELECT id vault_id FROM vaults WHERE id=$1 AND user_id=$2 AND owner_pubkey=$3'
      : 'SELECT a.vault_id FROM agents a JOIN vaults v ON v.id=a.vault_id WHERE a.id=$1 AND v.user_id=$2 AND v.owner_pubkey=$3', [id,...this.scope])).rows[0];
    if(!row) throw Object.assign(new Error('Not found'),{status:404});
    await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[row.vault_id]);
  }
  async assertOwned(kind: "vaults" | "agents", id: string) {
    const predicate =
      kind === "vaults"
        ? "user_id=$2 AND owner_pubkey=$3"
        : "EXISTS(SELECT 1 FROM vaults WHERE id=agents.vault_id AND user_id=$2 AND owner_pubkey=$3)";
    if (
      !(
        await query(`SELECT id FROM ${kind} WHERE id=$1 AND ${predicate}`, [
          id,
          ...this.scope,
        ])
      ).rows[0]
    )
      throw Object.assign(new Error("Not found"), { status: 404 });
  }

  async vaults() {
    return (
      await query(
        `SELECT v.id,v.user_id,v.owner_pubkey,v.vault_pubkey,v.status,v.created_at,v.policies,v.execution_mode,v.mode_version,v.daily_cap_lamports::text,EXISTS(SELECT 1 FROM vault_signers WHERE vault_id=v.id) signer_ready,COALESCE((SELECT SUM(t.amount_lamports+COALESCE(t.actual_fee_lamports,t.network_fee_lamports,0)) FROM transactions t JOIN agents a ON a.id=t.agent_id WHERE a.vault_id=v.id AND t.settlement_status='CONFIRMED' AND t.reserved_at>NOW()-INTERVAL '24 hours'),0)::text spent_today_lamports FROM vaults v WHERE v.user_id=$1 AND v.owner_pubkey=$2 ORDER BY v.created_at`,
        this.scope,
      )
    ).rows;
  }
  async agents() {
    return (
      await query(
        `SELECT a.*,COALESCE((SELECT SUM((after_state->'result'->>'amount_lamports')::bigint) FROM audit_events WHERE target_id=a.id::text AND action='SIMULATION' AND after_state->'result'->>'decision'='APPROVED' AND created_at>=date_trunc('day',NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'),0)::text simulated_spent_today_lamports,COALESCE((SELECT jsonb_agg(jsonb_build_object('recipient_pubkey',recipient_pubkey,'label',label)) FROM whitelist_recipients WHERE agent_id=a.id),'[]'::jsonb) recipients,COALESCE((SELECT SUM(amount_lamports) FROM transactions WHERE agent_id=a.id AND settlement_status='CONFIRMED' AND reserved_at>NOW()-INTERVAL '24 hours'),0)::text spent_today_lamports,(SELECT COUNT(*)::int FROM transactions WHERE agent_id=a.id) transaction_count FROM agents a WHERE EXISTS(SELECT 1 FROM vaults WHERE id=a.vault_id AND user_id=$1 AND owner_pubkey=$2) ORDER BY created_at`,
        this.scope,
      )
    ).rows;
  }
  async events() {
    return (
      await query(
        "SELECT id,vault_id,actor_id,action,target_id,reason,created_at FROM audit_events WHERE EXISTS(SELECT 1 FROM vaults WHERE id=audit_events.vault_id AND user_id=$1 AND owner_pubkey=$2) ORDER BY created_at DESC LIMIT 100",
        this.scope,
      )
    ).rows;
  }
  async simulations() {
    return (
      await query(
        "SELECT after_state->'result' result FROM audit_events WHERE action='SIMULATION' AND EXISTS(SELECT 1 FROM vaults WHERE id=audit_events.vault_id AND user_id=$1 AND owner_pubkey=$2) ORDER BY created_at DESC LIMIT 100",
        this.scope,
      )
    ).rows.map((r) => r.result);
  }
  async localVault(pubkey: string) {
    const c = await pool.connect();
    try {
      await c.query("BEGIN");
      await c.query("SELECT pg_advisory_xact_lock(hashtext($1))", [pubkey]);
      if (pubkey !== this.identity.owner_pubkey)
        throw Object.assign(
          new Error("Wallet must match authenticated owner"),
          { status: 403 },
        );
      const existing = (
        await c.query(
          "SELECT id,user_id,owner_pubkey,vault_pubkey,status,created_at,policies FROM vaults WHERE vault_pubkey=$1 AND user_id=$2 AND owner_pubkey=$1",
          [pubkey, this.identity.user_id],
        )
      ).rows[0];
      if (existing) {
        await c.query("COMMIT");
        return existing;
      }
      const user = { id: this.identity.user_id };
      const v = (
        await c.query(
          "INSERT INTO vaults(user_id,owner_pubkey,vault_pubkey,key_reference) VALUES($1,$2,$2,$3) RETURNING id,user_id,owner_pubkey,vault_pubkey,status,created_at,policies",
          [user.id, pubkey, "external-wallet:" + pubkey],
        )
      ).rows[0];
      await c.query("COMMIT");
      return v;
    } catch (e) {
      await c.query("ROLLBACK");
      throw e;
    } finally {
      c.release();
    }
  }
  async stats() {
    return {
      blocked: Number(
        (
          await query(
            `SELECT (
              (SELECT COUNT(*) FROM transactions WHERE decision='BLOCKED' AND EXISTS(SELECT 1 FROM agents a JOIN vaults v ON v.id=a.vault_id WHERE a.id=transactions.agent_id AND v.user_id=$1 AND v.owner_pubkey=$2))
              +
              (SELECT COUNT(*) FROM audit_events WHERE action='SIMULATION' AND after_state->'result'->>'decision'='BLOCKED' AND EXISTS(SELECT 1 FROM vaults WHERE id=audit_events.vault_id AND user_id=$1 AND owner_pubkey=$2))
            ) count`,
            this.scope,
          )
        ).rows[0].count,
      ),
      chart: (
        await query(
          `WITH all_events AS (
            SELECT (created_at AT TIME ZONE 'UTC')::date dt, decision::text decision
            FROM transactions
            WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'
              AND EXISTS(SELECT 1 FROM agents a JOIN vaults v ON v.id=a.vault_id WHERE a.id=transactions.agent_id AND v.user_id=$1 AND v.owner_pubkey=$2)
            UNION ALL
            SELECT (created_at AT TIME ZONE 'UTC')::date dt, (after_state->'result'->>'decision')::text decision
            FROM audit_events
            WHERE action='SIMULATION'
              AND created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'
              AND EXISTS(SELECT 1 FROM vaults WHERE id=audit_events.vault_id AND user_id=$1 AND owner_pubkey=$2)
          )
          SELECT dt::text date,
                 COUNT(*) FILTER(WHERE decision='APPROVED')::int approved,
                 COUNT(*) FILTER(WHERE decision='BLOCKED')::int blocked
          FROM all_events
          GROUP BY 1
          ORDER BY 1`,
          this.scope,
        )
      ).rows,
    };
  }
  async transactions() {
    return (
      await query(
        "SELECT t.id,t.agent_id,t.recipient_pubkey,t.amount_lamports,t.decision,t.settlement_status,t.error_code,t.purpose,t.solana_signature,t.created_at,a.name agent_name FROM transactions t JOIN agents a ON a.id=t.agent_id JOIN vaults v ON v.id=a.vault_id WHERE v.user_id=$1 AND v.owner_pubkey=$2 ORDER BY t.created_at DESC LIMIT 100",
        this.scope,
      )
    ).rows;
  }
  async history(id: string) {
    await this.assertOwned("agents", id);
    return {
      transactions: (
        await query(
          "SELECT id,agent_id,recipient_pubkey,amount_lamports,decision,settlement_status,error_code,purpose,solana_signature,created_at FROM transactions WHERE agent_id=$1 ORDER BY created_at DESC LIMIT 100",
          [id],
        )
      ).rows,
      events: (
        await query(
          "SELECT id,action,target_id,reason,created_at FROM audit_events WHERE target_id=$1 ORDER BY created_at DESC LIMIT 100",
          [id],
        )
      ).rows,
    };
  }
  async mutate(
    kind: "agents" | "vaults",
    id: string,
    input: Record<string, unknown>,
  ) {
    const c = await pool.connect();
    try {
      await c.query("BEGIN");
      await this.lockVault(c,kind,id);
      const predicate =
        kind === "vaults"
          ? "user_id=$2 AND owner_pubkey=$3"
          : "EXISTS(SELECT 1 FROM vaults WHERE id=agents.vault_id AND user_id=$2 AND owner_pubkey=$3)";
      const old = (
        await c.query(
          `SELECT * FROM ${kind} WHERE id=$1 AND ${predicate} FOR UPDATE`,
          [id, ...this.scope],
        )
      ).rows[0];
      if (!old) throw Object.assign(new Error("Not found"), { status: 404 });
      if (kind === "agents" && input.vault_id) {
        const targetVault = (
          await c.query(
            "SELECT id FROM vaults WHERE id=$1 AND user_id=$2 AND owner_pubkey=$3",
            [input.vault_id, ...this.scope],
          )
        ).rows[0];
        if (!targetVault) {
          throw Object.assign(new Error("Vault not found"), { status: 404 });
        }
        await c.query("SELECT pg_advisory_xact_lock(hashtext($1))", [input.vault_id]);

        if (input.vault_id !== old.vault_id) {
          const pending = (await c.query("SELECT 1 FROM payments WHERE agent_id=$1 AND approval_status='PENDING' LIMIT 1", [id])).rows[0];
          if (pending) {
            throw Object.assign(new Error("Cannot reassign vault: agent has pending payment requests awaiting approval"), { status: 400 });
          }
          const recentTx = (await c.query("SELECT 1 FROM transactions WHERE agent_id=$1 AND reserved_at > NOW() - INTERVAL '24 hours' AND settlement_status='CONFIRMED' UNION ALL SELECT 1 FROM payments WHERE agent_id=$1 AND created_at > NOW() - INTERVAL '24 hours' AND settlement_status='CONFIRMED' LIMIT 1", [id])).rows[0];
          if (recentTx) {
            throw Object.assign(new Error("Cannot reassign vault: agent has active 24-hour spending history. Deploy a new agent to the target vault to preserve accounting integrity."), { status: 400 });
          }
        }
      }
      if (
        kind === "agents" &&
        BigInt(
          String(input.single_tx_cap_lamports ?? old.single_tx_cap_lamports),
        ) > BigInt(String(input.daily_cap_lamports ?? old.daily_cap_lamports))
      )
        throw Object.assign(new Error("Single cap must not exceed daily cap"), {
          status: 400,
        });
      const keys = Object.keys(input);
      const row = (
        await c.query(
          `UPDATE ${kind} SET ${keys.map((k, i) => `${k}=$${i + 2}`).join(",")} WHERE id=$1 RETURNING *`,
          [id, ...Object.values(input)],
        )
      ).rows[0];
      await c.query(
        "INSERT INTO audit_events(vault_id,actor_id,action,target_id,before_state,after_state) VALUES($1,$2,$3,$4,$5,$6)",
        [
          kind === "vaults" ? id : row.vault_id,
          this.identity.owner_pubkey,
          `${kind.toUpperCase()}_UPDATED`,
          id,
          Object.fromEntries(keys.map((key) => [key, old[key]])),
          Object.fromEntries(keys.map((key) => [key, row[key]])),
        ],
      );
      await c.query("COMMIT");
      if (kind === "vaults") delete row.key_reference;
      return row;
    } catch (e) {
      await c.query("ROLLBACK");
      throw e;
    } finally {
      c.release();
    }
  }
  async whitelist(id: string, recipients: any[]) {
    const c = await pool.connect();
    try {
      await c.query("BEGIN");
      await this.lockVault(c,'agents',id);
      const a = (
        await c.query(
          "SELECT vault_id FROM agents WHERE id=$1 AND EXISTS(SELECT 1 FROM vaults WHERE id=agents.vault_id AND user_id=$2 AND owner_pubkey=$3) FOR UPDATE",
          [id, ...this.scope],
        )
      ).rows[0];
      if (!a)
        throw Object.assign(new Error("Agent not found"), { status: 404 });
      await c.query("DELETE FROM whitelist_recipients WHERE agent_id=$1", [id]);
      for (const r of recipients)
        await c.query(
          "INSERT INTO whitelist_recipients(agent_id,recipient_pubkey,label) VALUES($1,$2,$3)",
          [id, r.recipient_pubkey, r.label],
        );
      await c.query(
        "INSERT INTO audit_events(vault_id,actor_id,action,target_id,after_state) VALUES($1,$4,'WHITELIST_UPDATED',$2,$3)",
        [a.vault_id, id, { recipients }, this.identity.owner_pubkey],
      );
      await c.query("COMMIT");
      return { recipients };
    } catch (e) {
      await c.query("ROLLBACK");
      throw e;
    } finally {
      c.release();
    }
  }
  async panic() {
    const c = await pool.connect();
    try {
      await c.query("BEGIN");
      const vaults = (await c.query('SELECT id FROM vaults WHERE user_id=$1 AND owner_pubkey=$2 ORDER BY id',this.scope)).rows;
      for(const vault of vaults) await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[vault.id]);
      const rows = (
        await c.query(
          "UPDATE agents SET status='FROZEN' WHERE status='ACTIVE' AND EXISTS(SELECT 1 FROM vaults WHERE id=agents.vault_id AND user_id=$1 AND owner_pubkey=$2) RETURNING id,vault_id",
          this.scope,
        )
      ).rows;
      for (const a of rows)
        await c.query(
          "INSERT INTO audit_events(vault_id,actor_id,action,target_id,reason) VALUES($1,$3,'PANIC_FREEZE',$2,'Emergency freeze')",
          [a.vault_id, a.id, this.identity.owner_pubkey],
        );
      await c.query("COMMIT");
      return { count: rows.length };
    } catch (e) {
      await c.query("ROLLBACK");
      throw e;
    } finally {
      c.release();
    }
  }
  async simulate(
    input: any,
    evaluate: (
      agent: any,
      policies: any,
      spent: bigint,
      listed: boolean,
    ) => Promise<string | null>,
  ) {
    const c = await pool.connect();
    try {
      await c.query("BEGIN");
      await this.lockVault(c,'agents',input.agent_id);
      const a = (
        await c.query(
          "SELECT a.*,v.status vault_status,v.policies,v.vault_pubkey FROM agents a JOIN vaults v ON v.id=a.vault_id WHERE a.id=$1 AND v.user_id=$2 AND v.owner_pubkey=$3 FOR UPDATE OF a,v",
          [input.agent_id, ...this.scope],
        )
      ).rows[0];
      if (!a)
        throw Object.assign(new Error("Agent not found"), { status: 404 });
      const prior = (
        await c.query(
          "SELECT after_state FROM audit_events WHERE target_id=$1 AND action='SIMULATION' AND after_state->>'request_id'=$2",
          [a.id, input.request_id],
        )
      ).rows[0]?.after_state;
      if (prior) {
        if (
          Object.keys(input).some((key) => prior.input[key] !== input[key]) ||
          Object.keys(prior.input).some(
            (key) => prior.input[key] !== input[key],
          )
        )
          throw Object.assign(
            new Error("Request ID already used with different payload"),
            { status: 409 },
          );
        await c.query("COMMIT");
        return prior.result;
      }
      const spent = (
        await c.query(
          "SELECT COALESCE(SUM((after_state->'result'->>'amount_lamports')::bigint),0)::text spent FROM audit_events WHERE target_id=$1 AND action='SIMULATION' AND after_state->'result'->>'decision'='APPROVED' AND created_at>=date_trunc('day',NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'",
          [a.id],
        )
      ).rows[0].spent;
      const listed =
        (
          await c.query(
            "SELECT 1 FROM whitelist_recipients WHERE agent_id=$1 AND recipient_pubkey=$2",
            [a.id, input.recipient_pubkey],
          )
        ).rowCount! > 0;
      const reason = await evaluate(a, a.policies, BigInt(spent), listed);
      const result = {
        id: require("crypto").randomUUID(),
        decision: reason ? "BLOCKED" : "APPROVED",
        reason: reason ?? "POLICY_PASSED",
        mode: "SIMULATION",
        settlement_status: "NOT_SUBMITTED",
        amount_lamports: input.amount_lamports,
        agent_id: a.id,
        created_at: new Date().toISOString(),
      };
      await c.query(
        "INSERT INTO audit_events(id,vault_id,actor_id,action,target_id,reason,after_state) VALUES($1,$2,$6,'SIMULATION',$3,$4,$5)",
        [
          result.id,
          a.vault_id,
          a.id,
          result.reason,
          { request_id: input.request_id, input, result },
          this.identity.owner_pubkey,
        ],
      );
      await c.query("COMMIT");
      return result;
    } catch (e) {
      await c.query("ROLLBACK");
      throw e;
    } finally {
      c.release();
    }
  }
}
