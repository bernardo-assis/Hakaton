import { useEffect, useRef, useState } from 'react';
import { ApiError, request, fromLamports, sol, toLamports } from '../lib/api';
import type { Agent, Vault } from '../lib/api';
import { explorerLink, paymentLabel, paymentRequest, submitOwnerPayment } from '../lib/payments';
import { useWalletAuth } from './WalletAuth';
import type { Payment, PaymentConfig } from '../lib/payments';
type TestVault = Vault & {
    signer_ready?: boolean;
};
const field = 'w-full min-w-0 bg-[#F6F7F7] border border-[#E8EAEC] rounded-[10px] px-3 py-2 text-[13px]';
const button = 'bg-[#064E3B] text-white px-4 py-2 rounded-full text-[13px] font-semibold disabled:opacity-50';
export function DevnetPayments() {
    const [vaults, setVaults] = useState<TestVault[]>([]), [agents, setAgents] = useState<Agent[]>([]), [selected, setSelected] = useState(''), [config, setConfig] = useState<PaymentConfig | null>(null), [payments, setPayments] = useState<Payment[]>([]), [pending, setPending] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState(''), [agent, setAgent] = useState(''), [recipient, setRecipient] = useState(''), [amount, setAmount] = useState(''), [purpose, setPurpose] = useState(''), [cap, setCap] = useState('1');
    const capDirty = useRef(false);
    const pendingDepth = useRef(100);
    const [pendingOffset, setPendingOffset] = useState(0), [hasMorePending, setHasMorePending] = useState(false);
    const auth = useWalletAuth();
    const scope = `${auth.session?.owner_pubkey ?? ''}:${selected}`;
    const alive = useRef(true);
    const epoch = useRef(0);
    const explain = (e: unknown) => e instanceof ApiError && e.status === 501 ? 'The test vault is not enabled on the server yet.' : e instanceof Error ? e.message : 'Payments could not be refreshed.';
    const load = async (id = selected) => {
        const generation = ++epoch.current;
        setLoading(true);
        try {
            const [v, a] = await Promise.all([request<TestVault[]>('/vaults'), request<Agent[]>('/agents')]);
            if (!alive.current || generation !== epoch.current)
                return;
            const test = v.filter(x => x.signer_ready);
            setVaults(test);
            setAgents(a);
            const next = test.some(x => x.id === id) ? id : (test[0]?.id ?? '');
            setSelected(next);
            if (next) {
                const [c, p, firstPage] = await Promise.all([request<PaymentConfig>(`/vaults/${next}/payment-config`), request<Payment[]>(`/payments?vault_id=${encodeURIComponent(next)}&limit=100`), request<Payment[]>(`/payments?vault_id=${encodeURIComponent(next)}&approval_status=PENDING&limit=100`)]);
                let q = firstPage;
                let lastPage = firstPage;
                while (q.length < pendingDepth.current && lastPage.length === 100) {
                    lastPage = await request<Payment[]>(`/payments?vault_id=${encodeURIComponent(next)}&approval_status=PENDING&limit=100&offset=${q.length}`);
                    q = [...q, ...lastPage];
                }
                if (!alive.current || generation !== epoch.current)
                    return;
                setConfig(c);
                setPayments(p);
                setPending(q.filter((entry, index) => q.findIndex(other => other.id === entry.id) === index));
                setPendingOffset(q.length);
                setHasMorePending(lastPage.length === 100);
                if (!capDirty.current)
                    setCap(String(fromLamports(c.daily_cap_lamports)));
                setAgent(old => a.some(x => x.id === old && x.vault_id === next) ? old : (a.find(x => x.vault_id === next)?.id ?? ''));
            }
            else {
                setConfig(null);
                setPayments([]);
                setPending([]);
            }
            setError('');
        }
        catch (e) {
            if (alive.current && generation === epoch.current)
                setError(explain(e));
        }
        finally {
            if (alive.current && generation === epoch.current)
                setLoading(false);
        }
    };
    useEffect(() => {
        alive.current = true;
        void load();
        return () => {
            alive.current = false;
            epoch.current++;
        };
    }, []);
    useEffect(() => {
        if (!selected)
            return;
        const interval = setInterval(() => {
            if (!busy)
                void load(selected);
        }, 15000);
        return () => clearInterval(interval);
    }, [selected, busy]);
    const act = async (action: () => Promise<void>) => {
        setBusy(true);
        setError('');
        setMessage('');
        try {
            await action();
        }
        catch (e) {
            if (alive.current)
                setError(explain(e));
        }
        finally {
            if (alive.current)
                setBusy(false);
        }
    };
    const create = () => act(async () => {
        const v = await request<TestVault>('/vaults/devnet', { method: 'POST', body: JSON.stringify({ daily_cap_lamports: toLamports(cap) }) });
        if (!alive.current)
            return;
        await load(v.id);
        setMessage('Test vault created. Send only Devnet SOL to the address shown.');
    });
    const mode = (execution_mode: 'AUTOMATIC' | 'MANUAL') => act(async () => {
        if (!config)
            return;
        await request(`/vaults/${selected}/payment-config`, { method: 'PATCH', body: JSON.stringify({ execution_mode, expected_mode_version: String(config.mode_version) }) });
        await load();
        setMessage(execution_mode === 'AUTOMATIC' ? 'New requests can be sent automatically. Earlier requests still await approval.' : 'Requests that have not been sent now require approval.');
    });
    const saveCap = () => act(async () => {
        if (!config)
            return;
        await request(`/vaults/${selected}/payment-config`, { method: 'PATCH', body: JSON.stringify({ execution_mode: config.execution_mode, expected_mode_version: String(config.mode_version), daily_cap_lamports: toLamports(cap) }) });
        capDirty.current = false;
        await load();
        setMessage('Rolling 24-hour limit updated.');
    });
    const submit = () => act(async () => {
        const draft = paymentRequest(agent, 'draft', recipient, amount, purpose);
        const p = await submitOwnerPayment(localStorage, scope, draft);
        setAmount('');
        setPurpose('');
        await load();
        setMessage(`Request recorded: ${paymentLabel(p)}.`);
    });
    const morePending = () => act(async () => {
        const q = await request<Payment[]>(`/payments?vault_id=${encodeURIComponent(selected)}&approval_status=PENDING&limit=100&offset=${pendingOffset}`);
        if (!alive.current)
            return;
        setPending(prev => [...prev, ...q.filter(x => !prev.some(old => old.id === x.id))]);
        pendingDepth.current += q.length;
        setPendingOffset(old => old + q.length);
        setHasMorePending(q.length === 100);
    });
    const review = (p: Payment, approve: boolean) => act(async () => {
        await request(`/payments/${p.id}/${approve ? 'approve' : 'reject'}`, { method: 'POST', body: JSON.stringify(approve ? { expected_mode_version: String(config?.mode_version) } : {}) });
        await load();
        setMessage(approve ? 'Approval recorded. Follow the network result.' : 'Request rejected.');
    });
    const vault = vaults.find(v => v.id === selected);
    const disabled = busy || loading;
    const enabled = config?.payments_enabled !== false;
    return <section aria-label="Devnet Payments" className="bg-white rounded-[22px] p-6 shadow-sm border border-gray-100 mb-8 min-w-0">
 <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
    <div>
    <h2 className="text-[#111827] text-[20px] font-semibold">Devnet Payments</h2>
    <p className="text-[#777D85] text-[13px] mt-1">A separate vault for test SOL, with spending limits and optional approval.</p>
    </div>
    <button className={button} disabled={disabled} onClick={() => void create()}>Create test vault</button>
    </div>
 {error && <p role="alert" className="text-[#F04448] text-[13px] mb-3">{error} <button className="underline" onClick={() => void load()}>Refresh payments</button>
        </p>}{message && <p role="status" className="text-[#24865E] text-[13px] mb-3">{message}</p>}{loading && <p role="status" className="text-[#777D85] text-[13px] mb-3">Refreshing payments...</p>}
 {!vault && !loading && <p className="text-[#777D85] text-[13px]">Create a test vault to begin. Your Phantom wallet is still used to sign in.</p>}
 {vault && <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <label className="text-[13px]">Test vault<select className={field} aria-label="Payment vault" value={selected} disabled={disabled} onChange={e => {
                capDirty.current = false;
                pendingDepth.current = 100;
                setConfig(null);
                setPayments([]);
                setPending([]);
                void load(e.target.value);
            }}>{vaults.map(v => <option key={v.id} value={v.id}>{v.vault_pubkey.slice(0, 8)}…</option>)}</select>
        </label>
        <div className="text-[13px] min-w-0">Devnet SOL deposit address<p className="break-all text-[#777D85] mt-2">{vault.vault_pubkey}</p>
        </div>
        </div>
 {config && <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <label className="text-[13px]">Payment mode<select aria-label="Payment mode" className={field} value={config.execution_mode} disabled={disabled || !enabled} onChange={e => void mode(e.target.value as 'AUTOMATIC' | 'MANUAL')}>
            <option value="AUTOMATIC">Automatic</option>
            <option value="MANUAL">Manual approval</option>
            </select>
            </label>
            <div>
            <label className="text-[13px]">Vault rolling 24-hour limit (SOL)<input aria-label="Vault rolling 24-hour limit (SOL)" className={field} inputMode="decimal" value={cap} onChange={e => {
                    capDirty.current = true;
                    setCap(e.target.value);
                }}/>
            </label>
            <button className="text-[12px] underline mt-2" disabled={disabled} onClick={() => void saveCap()}>Save limit</button>
            </div>
            </div>
 <p className="text-[#777D85] text-[12px] mb-4">Changing mode keeps the same vault. Earlier queued requests need individual approval. Sent payments continue to be checked.</p>{!enabled && <p role="status" className="text-[#777D85] text-[13px] mb-4">Payment sending is disabled on the server.</p>}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">{[['Available balance', config.available_lamports], ['Reserved for requests', config.reserved_lamports], ['Spent in 24 hours', config.spent_24h_lamports]].map(([label, value]) => <div key={label} className="bg-[#F6F7F7] rounded-[12px] p-4">
                <p className="text-[#777D85] text-[12px]">{label}</p>
                <p className="text-[#111827] font-semibold mt-1">{value == null ? 'Unavailable' : sol(fromLamports(value))}</p>
                </div>)}</div>
 <form onSubmit={e => {
                    e.preventDefault();
                    void submit();
                }} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <label className="text-[13px]">Payment agent<select required aria-label="Payment agent" className={field} value={agent} onChange={e => setAgent(e.target.value)}>
            <option value="">Select</option>{agents.filter(a => a.vault_id === selected).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
            </label>
            <label className="text-[13px]">Devnet recipient<input required aria-label="Devnet recipient" className={field} value={recipient} onChange={e => setRecipient(e.target.value)}/>
            </label>
            <label className="text-[13px]">Payment amount (SOL)<input required aria-label="Payment amount (SOL)" inputMode="decimal" className={field} value={amount} onChange={e => setAmount(e.target.value)}/>
            </label>
            <label className="text-[13px]">Purpose<input aria-label="Payment purpose" maxLength={280} className={field} value={purpose} onChange={e => setPurpose(e.target.value)}/>
            </label>
            <div className="md:col-span-2">
            <button type="submit" className={button} disabled={disabled || !enabled || !agent}>{busy ? 'Processing...' : 'Request payment'}</button>
            <p className="text-[#777D85] text-[12px] mt-2">In automatic mode, this request may send test SOL immediately. Limits and allowed recipients still apply.</p>
            </div>
            </form>
 <h3 className="text-[#111827] text-[16px] font-semibold mb-3">Approval queue</h3>{!pending.length && <p className="text-[#777D85] text-[13px] mb-5">No requests awaiting approval.</p>}<div className="space-y-3 mb-6">{pending.map(p => <div key={p.id} className="border border-[#E8EAEC] rounded-[12px] p-4 flex flex-wrap gap-3 items-center justify-between">
                <div className="min-w-0">
                <p className="text-[13px] font-medium">{sol(fromLamports(p.amount_lamports))} · {agents.find(a => a.id === p.agent_id)?.name ?? 'Agent'}</p>
                <p className="text-[#777D85] text-[12px] break-words">{p.purpose || 'No purpose provided'}</p>
                <p className="text-[#777D85] text-[12px] break-all">Recipient: {p.recipient_pubkey}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                <button aria-label="Approve payment" className={button} disabled={disabled || !enabled} onClick={() => void review(p, true)}>Approve</button>
                <button aria-label="Reject payment" className="border border-[#E8EAEC] rounded-full px-4 py-2 text-[13px] disabled:opacity-50" disabled={disabled} onClick={() => void review(p, false)}>Reject</button>
                </div>
                </div>)}</div>{hasMorePending && <button className="text-[#24865E] underline text-[13px] mb-5" disabled={disabled} onClick={() => void morePending()}>Load more requests awaiting approval</button>}
 <h3 className="text-[#111827] text-[16px] font-semibold mb-3">Payment history</h3>
            <p className="text-[#777D85] text-[12px] mb-3">Up to 100 recent requests. Simulations are excluded. Paid network fees count toward the vault limit, including failed on-chain transactions.</p>{!payments.length && <p className="text-[#777D85] text-[13px]">No payments recorded.</p>}<div className="space-y-3">{payments.map(p => {
                    const link = explorerLink(p.solana_signature ?? '');
                    return <div key={p.id} className="border border-[#E8EAEC] rounded-[12px] p-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                    <p className="text-[13px] font-medium">{sol(fromLamports(p.amount_lamports))}</p>
                    <p className="text-[#777D85] text-[12px] break-words">{p.purpose || 'No purpose provided'}</p>
                    <p className="text-[#777D85] text-[12px] break-all">Recipient: {p.recipient_pubkey}</p>
                    </div>
                    <div className="text-[13px]">
                    <p>{paymentLabel(p)}</p>{link && <a className="text-[#24865E] underline text-[12px]" href={link} target="_blank" rel="noreferrer">View on Solana Devnet</a>}</div>
                    </div>;
                })}</div>
 </>}</>}
 </section>;
}
