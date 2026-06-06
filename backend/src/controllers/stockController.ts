import type { Context } from 'hono';
import { query, getPool } from '../config/db.js';

export const stockPurchase = async (c: Context) => {
    const { ingredient_id, quantity, reason } = await c.req.json();
    const pool = getPool();
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(
            'UPDATE ingredients SET current_stock = current_stock + $1 WHERE id = $2',
            [quantity, ingredient_id]
        );
        await client.query(
            'INSERT INTO stock_movements (ingredient_id, type, quantity, reason) VALUES ($1, $2, $3, $4)',
            [ingredient_id, 'purchase', quantity, reason || null]
        );
        await client.query('COMMIT');
        return c.json({ success: true });
    } catch {
        await client.query('ROLLBACK');
        return c.json({ error: 'Failed to record purchase' }, 500);
    } finally {
        client.release();
    }
};

export const stockWaste = async (c: Context) => {
    const { ingredient_id, quantity, reason } = await c.req.json();
    const pool = getPool();
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(
            'UPDATE ingredients SET current_stock = GREATEST(0, current_stock - $1) WHERE id = $2',
            [quantity, ingredient_id]
        );
        await client.query(
            'INSERT INTO stock_movements (ingredient_id, type, quantity, reason) VALUES ($1, $2, $3, $4)',
            [ingredient_id, 'waste', -quantity, reason || null]
        );
        await client.query('COMMIT');
        return c.json({ success: true });
    } catch {
        await client.query('ROLLBACK');
        return c.json({ error: 'Failed to record waste' }, 500);
    } finally {
        client.release();
    }
};

export const getStockMovements = async (c: Context) => {
    const { ingredient_id, type, from, to, limit } = c.req.query();
    try {
        const conditions: string[] = [];
        const params: unknown[] = [];
        let i = 1;

        if (ingredient_id) { conditions.push(`sm.ingredient_id = $${i++}`); params.push(ingredient_id); }
        if (type) { conditions.push(`sm.type = $${i++}`); params.push(type); }
        if (from) { conditions.push(`sm.created_at >= $${i++}::timestamp`); params.push(from); }
        if (to) { conditions.push(`sm.created_at < $${i++}::timestamp + interval '1 day'`); params.push(to); }

        const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const limitClause = `LIMIT ${parseInt(limit ?? '50') || 50}`;

        const res = await query(`
            SELECT sm.*, i.name as ingredient_name, i.unit
            FROM stock_movements sm
            JOIN ingredients i ON sm.ingredient_id = i.id
            ${where}
            ORDER BY sm.created_at DESC
            ${limitClause}
        `, params);

        return c.json(res.rows);
    } catch {
        return c.json({ error: 'Failed to fetch movements' }, 500);
    }
};
