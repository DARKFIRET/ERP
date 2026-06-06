import type { Context } from 'hono';
import { getPool } from '../config/db.js';
import type { Variables } from '../types/index.js';

const ALLOWED_KEYS = ['mode', 'primaryColor', 'appName', 'iconDataUrl'] as const;

export const getSettings = async (c: Context) => {
    const pool = getPool();
    const result = await pool.query('SELECT key, value FROM app_settings');
    const settings: Record<string, string> = {};
    for (const row of result.rows) {
        settings[row.key] = row.value;
    }
    return c.json(settings);
};

export const updateSettings = async (c: Context<{ Variables: Variables }>) => {
    const pool = getPool();
    const body = await c.req.json<Record<string, string>>();
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const key of ALLOWED_KEYS) {
            if (key in body) {
                await client.query(
                    `INSERT INTO app_settings (key, value, updated_at)
                     VALUES ($1, $2, NOW())
                     ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
                    [key, body[key] ?? '']
                );
            }
        }
        await client.query('COMMIT');
        return c.json({ success: true });
    } catch {
        await client.query('ROLLBACK');
        return c.json({ error: 'Failed to save settings' }, 500);
    } finally {
        client.release();
    }
};
