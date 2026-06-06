import type { Context } from 'hono';
import { query, getPool } from '../config/db.js';
import { convertToStockUnit, compatibleUnits } from '../utils/unitConversion.js';

export const getRecipe = async (c: Context) => {
    const menuItemId = c.req.param('menuItemId');
    try {
        const res = await query(`
            SELECT mii.ingredient_id, i.name as ingredient_name,
                   i.unit as stock_unit, mii.recipe_unit, mii.quantity
            FROM menu_item_ingredients mii
            JOIN ingredients i ON mii.ingredient_id = i.id
            WHERE mii.menu_item_id = $1
            ORDER BY i.name ASC
        `, [menuItemId]);
        return c.json(res.rows);
    } catch {
        return c.json({ error: 'Failed to fetch recipe' }, 500);
    }
};

export const saveRecipe = async (c: Context) => {
    const menuItemId = c.req.param('menuItemId');
    const items: { ingredient_id: number; quantity: number; recipe_unit: string }[] = await c.req.json();

    // Validate units compatibility
    for (const item of items) {
        const ingRes = await query('SELECT unit FROM ingredients WHERE id = $1', [item.ingredient_id]);
        if (ingRes.rows.length === 0) return c.json({ error: `Ingredient ${item.ingredient_id} not found` }, 400);
        const stockUnit = ingRes.rows[0].unit;
        const allowed = compatibleUnits[stockUnit] ?? [stockUnit];
        if (!allowed.includes(item.recipe_unit)) {
            return c.json({ error: `Единица "${item.recipe_unit}" несовместима со складской единицей "${stockUnit}"` }, 400);
        }
    }

    const pool = getPool();
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM menu_item_ingredients WHERE menu_item_id = $1', [menuItemId]);
        for (const item of items) {
            await client.query(
                'INSERT INTO menu_item_ingredients (menu_item_id, ingredient_id, quantity, recipe_unit) VALUES ($1, $2, $3, $4)',
                [menuItemId, item.ingredient_id, item.quantity, item.recipe_unit]
            );
        }
        await client.query('COMMIT');
        return c.json({ success: true });
    } catch {
        await client.query('ROLLBACK');
        return c.json({ error: 'Failed to save recipe' }, 500);
    } finally {
        client.release();
    }
};

export const getMenuAvailability = async (c: Context) => {
    try {
        const res = await query(`
            SELECT
                m.id as menu_item_id,
                mii.quantity,
                mii.recipe_unit,
                i.current_stock,
                i.unit as stock_unit
            FROM menu_items m
            JOIN menu_item_ingredients mii ON m.id = mii.menu_item_id
            JOIN ingredients i ON mii.ingredient_id = i.id
        `);

        // Group by menu item, compute min portions with unit conversion
        const map: Record<number, number> = {};
        for (const row of res.rows) {
            const id = row.menu_item_id;
            const deductPerPortion = convertToStockUnit(Number(row.quantity), row.recipe_unit, row.stock_unit);
            const portions = deductPerPortion > 0 ? Math.floor(Number(row.current_stock) / deductPerPortion) : 0;
            if (map[id] === undefined || portions < (map[id] ?? 0)) {
                map[id] = portions;
            }
        }

        const availability: Record<number, { can_order: boolean; portions_available: number }> = {};
        for (const [id, portions] of Object.entries(map)) {
            availability[Number(id)] = { can_order: portions > 0, portions_available: portions };
        }
        return c.json(availability);
    } catch {
        return c.json({ error: 'Failed to fetch availability' }, 500);
    }
};
