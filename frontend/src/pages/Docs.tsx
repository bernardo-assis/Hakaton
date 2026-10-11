import { useState } from "react";

export function Docs({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [activeSection, setActiveSection] = useState<string>("overview");

  return (
    <div className="max-w-[1280px] mx-auto w-full px-6 mt-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#064E3B] text-[#B6F03F] tracking-wide uppercase">
              AgentSafe Protocol Documentation
            </span>
            <span className="text-gray-400 text-xs">v1.0.0 • Solana Devnet</span>
          </div>
          <h1 className="text-[#111827] text-[32px] font-bold font-inter tracking-tight">
            Developer & Architecture Guide
          </h1>
          <p className="text-[#777D85] text-[14px]">
            Complete specifications, security policies, API endpoints, and zero-custody wallet guardrails.
          </p>
        </div>
        {onNavigate && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate("simulator")}
              className="bg-[#B6F03F] text-[#111827] px-4 py-2 rounded-full text-xs font-semibold hover:shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Test Live Simulator
            </button>
            <button
              onClick={() => onNavigate("dashboard")}
              className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-full text-xs font-semibold hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
            >
              Open Dashboard &rarr;
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm sticky top-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">
              Sections
            </h3>
            <nav className="flex flex-col gap-1">
              {[
                { id: "overview", label: "1. Protocol Overview" },
                { id: "architecture", label: "2. Security Architecture" },
                { id: "policies", label: "3. Policy Engine & Caps" },
                { id: "api", label: "4. REST API Reference" },
                { id: "integration", label: "5. Agent SDK Quickstart" },
                { id: "zero-custody", label: "6. Zero-Custody Model" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`text-left px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    activeSection === item.id
                      ? "bg-[#064E3B] text-white font-semibold shadow-sm"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-500 px-2 leading-relaxed">
              <span className="font-semibold text-gray-700 block mb-1">Colosseum Hackathon Note:</span>
              AgentSafe is designed to serve as the critical firewall between LLM autonomous agents and Solana treasuries.
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 flex flex-col gap-8">
          {/* Section 1: Overview */}
          {activeSection === "overview" && (
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm flex flex-col gap-6 animate-in fade-in duration-200">
              <h2 className="text-2xl font-bold text-gray-900">1. Protocol Overview</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                As autonomous AI agents acquire agency to trade, hire external APIs, settle invoices, and execute micro-transactions, giving them raw unrestricted access to Solana private keys introduces fatal financial risk. Prompt injections, reasoning hallucination, or infinite loops can completely drain an organization's treasury in seconds.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-2">
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-[#064E3B]/10 text-[#064E3B] flex items-center justify-center font-bold text-sm mb-2">
                    01
                  </div>
                  <h4 className="font-semibold text-sm text-gray-900 mb-1">Treasury Firewall</h4>
                  <p className="text-xs text-gray-500">Every agent order is intercepted and verified against cryptographic hard caps before reaching the Solana network.</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-[#064E3B]/10 text-[#064E3B] flex items-center justify-center font-bold text-sm mb-2">
                    02
                  </div>
                  <h4 className="font-semibold text-sm text-gray-900 mb-1">Sub-Second Kill Switch</h4>
                  <p className="text-xs text-gray-500">Human supervisors can freeze individual rogue agents or trigger global panic stop in sub-50 milliseconds.</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-[#064E3B]/10 text-[#064E3B] flex items-center justify-center font-bold text-sm mb-2">
                    03
                  </div>
                  <h4 className="font-semibold text-sm text-gray-900 mb-1">On-Chain Audit Trails</h4>
                  <p className="text-xs text-gray-500">Immutable ledger tracking approved transactions, blocked attempts, and recipient whitelists.</p>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Architecture */}
          {activeSection === "architecture" && (
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm flex flex-col gap-6 animate-in fade-in duration-200">
              <h2 className="text-2xl font-bold text-gray-900">2. Security Architecture</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                AgentSafe enforces multi-tenant cryptographic isolation based on Solana Ed25519 wallet signatures. No raw private keys are stored on client browsers.
              </p>

              <div className="bg-[#0C1411] text-[#A5C0B4] p-5 rounded-xl font-mono text-xs overflow-x-auto border border-gray-800 leading-relaxed">
                <span className="text-[#B6F03F]">// Transaction Life-Cycle</span><br />
                1. Agent requests transfer (agent_id, amount_lamports, recipient_pubkey)<br />
                2. PolicyEngine intercepts & executes atomic verification:<br />
                &nbsp;&nbsp;&nbsp;&nbsp;├── Checks Agent Status (ACTIVE vs FROZEN)<br />
                &nbsp;&nbsp;&nbsp;&nbsp;├── Checks Vault Status (ACTIVE vs FROZEN)<br />
                &nbsp;&nbsp;&nbsp;&nbsp;├── Checks Single Tx Cap (amount &lt;= single_tx_cap)<br />
                &nbsp;&nbsp;&nbsp;&nbsp;├── Checks Rolling Daily Cap (spent_today + amount &lt;= daily_cap)<br />
                &nbsp;&nbsp;&nbsp;&nbsp;├── Verifies Whitelist (recipient must be registered)<br />
                &nbsp;&nbsp;&nbsp;&nbsp;└── Checks Low Balance Threshold on Solana Devnet<br />
                3. If any policy fails: transaction is BLOCKED, logged with error code, zero SOL is moved.<br />
                4. If policies pass: transaction is SUBMITTED & broadcasted via Solana RPC.
              </div>
            </div>
          )}

          {/* Section 3: Policies */}
          {activeSection === "policies" && (
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm flex flex-col gap-6 animate-in fade-in duration-200">
              <h2 className="text-2xl font-bold text-gray-900">3. Policy Engine & Caps</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                The Policy Engine supports granular, configurable parameters per vault and per agent.
              </p>

              <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="p-3 font-semibold text-gray-700">Policy</th>
                      <th className="p-3 font-semibold text-gray-700">Type</th>
                      <th className="p-3 font-semibold text-gray-700">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-600">
                    <tr>
                      <td className="p-3 font-mono text-gray-900">daily_cap_lamports</td>
                      <td className="p-3">BigInt</td>
                      <td className="p-3">Maximum cumulative lamports an agent can spend within a rolling 24-hour UTC window.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-gray-900">single_tx_cap_lamports</td>
                      <td className="p-3">BigInt</td>
                      <td className="p-3">Maximum lamports allowable in a single execution. Hard enforced &lt;= daily_cap.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-gray-900">whitelist_enabled</td>
                      <td className="p-3">Boolean</td>
                      <td className="p-3">Strict recipient restriction. Unlisted public keys are rejected immediately.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-gray-900">pause_on_low_balance</td>
                      <td className="p-3">Boolean</td>
                      <td className="p-3">Automatically suspends fleet spending if vault balance dips below safe reserves.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-gray-900">require_human_approval</td>
                      <td className="p-3">Boolean</td>
                      <td className="p-3">Routes transactions above the threshold to manual human signing queue.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Section 4: API */}
          {activeSection === "api" && (
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm flex flex-col gap-6 animate-in fade-in duration-200">
              <h2 className="text-2xl font-bold text-gray-900">4. REST API Reference</h2>
              
              <div className="flex flex-col gap-4">
                <div className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-xs">POST</span>
                    <span className="font-mono text-xs font-semibold text-gray-800">/api/transactions</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">Execute an on-chain transfer through the AgentSafe policy engine.</p>
                  <pre className="bg-gray-50 p-3 rounded-lg text-xs font-mono text-gray-700 overflow-x-auto">
{`// Request Body (JSON)
{
  "agent_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "amount_lamports": 500000000, // 0.5 SOL
  "recipient_pubkey": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "purpose": "Helius RPC subscription fee",
  "idempotency_key": "unique-request-id-12345",
  "request_hash": "sha256-hash-of-agent-reasoning"
}`}
                  </pre>
                </div>

                <div className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-xs">POST</span>
                    <span className="font-mono text-xs font-semibold text-gray-800">/api/agents/panic</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">Instantly freeze all active agents belonging to the authenticated wallet.</p>
                </div>
              </div>
            </div>
          )}

          {/* Section 5: Integration */}
          {activeSection === "integration" && (
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm flex flex-col gap-6 animate-in fade-in duration-200">
              <h2 className="text-2xl font-bold text-gray-900">5. Agent SDK Quickstart</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Connect your autonomous LangChain, AutoGPT, ElizaOS, or custom Python/TypeScript agent:
              </p>

              <pre className="bg-[#0C1411] text-[#A5C0B4] p-5 rounded-xl font-mono text-xs overflow-x-auto border border-gray-800 leading-relaxed">
{`import { AgentSafeClient } from "@agentsafe/sdk";

// 1. Initialize client using agent identity
const safe = new AgentSafeClient({
  agentId: process.env.AGENTSAFE_AGENT_ID,
  apiKey: process.env.AGENTSAFE_API_KEY,
  endpoint: "https://api.agentsafe.network"
});

// 2. Safely pay for external API services
async function payService(serviceWallet: string, solAmount: number) {
  try {
    const tx = await safe.pay({
      recipient: serviceWallet,
      amountSol: solAmount,
      purpose: "Dataset purchase"
    });
    console.log("Payment confirmed on Solana:", tx.signature);
  } catch (err) {
    // If agent hallucinates or exceeds cap, Firewall throws PolicyViolationError
    console.error("AgentSafe Firewall Blocked Request:", err.message);
  }
}`}
              </pre>
            </div>
          )}

          {/* Section 6: Zero-Custody */}
          {activeSection === "zero-custody" && (
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm flex flex-col gap-6 animate-in fade-in duration-200">
              <h2 className="text-2xl font-bold text-gray-900">6. Zero-Custody Security Model</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                AgentSafe follows the <strong>Principle of Least Privilege</strong> and <strong>Zero-Trust Architecture</strong>:
              </p>

              <ul className="list-disc list-inside text-xs text-gray-600 flex flex-col gap-2.5">
                <li><strong className="text-gray-900">No Private Key Storage:</strong> Organization owners authenticate using Phantom cryptographic challenge signatures (`Ed25519`). Private keys never leave the browser extension.</li>
                <li><strong className="text-gray-900">Isolated Treasury Signers:</strong> Agent operations are funded through compartmentalized vaults, isolating human wealth from agent operational budgets.</li>
                <li><strong className="text-gray-900">IDOR Defense:</strong> Every database query joins through `v.user_id = $2 AND v.owner_pubkey = $3`, ensuring cross-tenant data leakage is mathematically impossible.</li>
                <li><strong className="text-gray-900">Anti-CSRF & Origin Guard:</strong> All state mutations require strict CORS origin matches and explicit `X-AgentSafe-CSRF` headers.</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
