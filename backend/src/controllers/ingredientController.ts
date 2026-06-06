import type { Context } from 'hono';
import { query } from '../config/db.js';

export const getIngredients = async (c: Context) => {
    try {
        const res = await query(`
            SELECT *, (current_stock < min_stock) as low_stock
            FROM ingredients ORDER BY name ASC
        `);
        return c.json(res.rows);
    } catch {
        return c.json({ error: 'Failed to fetch ingredients' }, 500);
    }
};

export const getLowStock = async (c: Context) => {
    try {
        const res = await query(`
            SELECT * FROM ingredients WHERE current_stock < min_stock ORDER BY name ASC
        `);
        return c.json(res.rows);
    } catch {
        return c.json({ error: 'Failed to fetch low stock' }, 500);
    }
};

export const createIngredient = async (c: Context) => {
    const { name, unit, cost_price, current_stock, min_stock } = await c.req.json();
    try {
        const res = await query(
            'INSERT INTO ingredients (name, unit, cost_price, current_stock, min_stock) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, unit, cost_price ?? 0, current_stock ?? 0, min_stock ?? 0]
        );
        return c.json(res.rows[0], 201);
    } catch {
        return c.json({ error: 'Failed to create ingredient' }, 500);
    }
};

export const updateIngredient = async (c: Context) => {
    const id = c.req.param('id');
    const { name, unit, cost_price, current_stock, min_stock } = await c.req.json();
    try {
        const res = await query(
            'UPDATE ingredients SET name=$1, unit=$2, cost_price=$3, current_stock=$4, min_stock=$5 WHERE id=$6 RETURNING *',
            [name, unit, cost_price, current_stock, min_stock, id]
        );
        if (res.rows.length === 0) return c.json({ error: 'Not found' }, 404);
        return c.json(res.rows[0]);
    } catch {
        return c.json({ error: 'Failed to update ingredient' }, 500);
    }
};

export const deleteIngredient = async (c: Context) => {
    const id = c.req.param('id');
    try {
        const usedRes = await query('SELECT COUNT(*) FROM menu_item_ingredients WHERE ingredient_id = $1', [id]);
        if (parseInt(usedRes.rows[0].count) > 0) {
            return c.json({ error: 'Cannot delete: ingredient is used in recipes' }, 409);
        }
        await query('DELETE FROM ingredients WHERE id = $1', [id]);
        return c.json({ success: true });
    } catch {
        return c.json({ error: 'Failed to delete ingredient' }, 500);
    }
};
