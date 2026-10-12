import pool from '../db/database';
test('payment storage supports safe mode and durable dispatch fields', async () => {
    const columns = (await pool.query("SELECT table_name,column_name FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('vaults','transactions','vault_signers')")).rows;
    expect(columns).toEqual(expect.arrayContaining([
        expect.objectContaining({ table_name: 'vaults', column_name: 'execution_mode' }),
        expect.objectContaining({ table_name: 'vault_signers', column_name: 'encrypted_key' }),
        expect.objectContaining({ table_name: 'transactions', column_name: 'approval_status' }),
        expect.objectContaining({ table_name: 'transactions', column_name: 'last_valid_block_height' }),
    ]));
});

import { publicPayment } from '../repositories/PaymentRepository';

test('publicPayment exposes error_code and reason and strips sensitive fields', () => {
    const raw = {
        id: 'tx-1',
        error_code: 'DAILY_CAP_EXCEEDED',
        signed_tx_reference: 'secret-ref',
        request_hash: 'secret-hash',
        encrypted_key: 'secret-key',
    };
    const pub = publicPayment(raw);
    expect(pub.error_code).toBe('DAILY_CAP_EXCEEDED');
    expect(pub.reason).toBe('DAILY_CAP_EXCEEDED');
    expect(pub.signed_tx_reference).toBeUndefined();
    expect(pub.request_hash).toBeUndefined();
    expect(pub.encrypted_key).toBeUndefined();

    const rawReason = {
        id: 'tx-2',
        reason: 'RECIPIENT_NOT_ALLOWED',
    };
    const pubReason = publicPayment(rawReason);
    expect(pubReason.error_code).toBe('RECIPIENT_NOT_ALLOWED');
    expect(pubReason.reason).toBe('RECIPIENT_NOT_ALLOWED');
});

afterAll(() => pool.end());
