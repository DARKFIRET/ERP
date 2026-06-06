import { query } from '../config/db.js';

export async function getOrCreateClient(phone: string, guestName?: string): Promise<number> {
    const clientRes = await query('SELECT id FROM clients WHERE phone = $1', [phone]);
    if (clientRes.rows.length > 0) {
        const clientId = clientRes.rows[0].id;
        if (guestName) {
            await query('UPDATE clients SET first_name = COALESCE(first_name, $1) WHERE id = $2', [guestName, clientId]);
        }
        return clientId;
    }
    const newClientRes = await query(
        'INSERT INTO clients (phone, first_name) VALUES ($1, $2) RETURNING id',
        [phone, guestName ?? 'Гость']
    );
    return newClientRes.rows[0].id;
}
