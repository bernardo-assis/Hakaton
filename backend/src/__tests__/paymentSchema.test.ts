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
afterAll(() => pool.end());
