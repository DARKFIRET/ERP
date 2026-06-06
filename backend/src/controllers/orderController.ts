import type { Context } from 'hono';
import { query, getPool } from '../config/db.js';
import { getOrCreateClient } from '../utils/clientUtils.js';
import { convertToStockUnit } from '../utils/unitConversion.js';

export const getOrders = async (c: Context) => {
    const status = c.req.query('status'); // optional filter
    try {
        let queryText = `
            SELECT o.*, t.number as table_number,
                   COALESCE(c.first_name, o.phone, 'Гость') as guest_name,
                   json_agg(json_build_object('id', oi.id, 'name', m.name, 'quantity', oi.quantity, 'price', oi.price)) as items
            FROM orders o
            JOIN tables t ON o.table_id = t.id
            LEFT JOIN clients c ON o.client_id = c.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN menu_items m ON oi.menu_item_id = m.id
            WHERE DATE(o.created_at) = CURRENT_DATE
        `;
        const params: any[] = [];

        if (status) {
            queryText += ` AND o.status = $1`;
            params.push(status);
        } else {
             queryText += ` AND o.status IN ('open', 'cooking', 'ready', 'served')`;
        }

        queryText += ` GROUP BY o.id, t.number, c.first_name ORDER BY o.created_at ASC`;

        const res = await query(queryText, params);
        return c.json(res.rows);
    } catch (err) {
        console.error(err);
        return c.json({ error: 'Failed to fetch orders' }, 500);
    }
};

export const updateOrderStatus = async (c: Context) => {
    const id = c.req.param('id');
    const { status } = await c.req.json();
    try {
        await query('UPDATE orders SET status = $1 WHERE id = $2', [status, id]);
        return c.json({ success: true });
    } catch (err) {
        console.error(err);
        return c.json({ error: 'Failed to update order status' }, 500);
    }
};

export const getActiveOrder = async (c: Context) => {
    const tableId = c.req.param('tableId');
    try {
        const res = await query(`
            SELECT o.*,
                   json_agg(json_build_object('id', oi.id, 'name', m.name, 'quantity', oi.quantity, 'price', oi.price)) as items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN menu_items m ON oi.menu_item_id = m.id
            WHERE o.table_id = $1 AND o.status = 'open'
            GROUP BY o.id
        `, [tableId]);

        if (res.rows.length === 0) return c.json(null);
        return c.json(res.rows[0]);
    } catch (err) {
        return c.json({ error: 'Failed to fetch active order' }, 500);
    }
};

export const createOrder = async (c: Context) => {
    let { tableId, items, phone, bookingId } = await c.req.json(); // items: { menu_item_id, quantity, price }[]

    try {
        // 1. Get or Create Client
        let clientId: number | null = null;
        if (phone) {
            clientId = await getOrCreateClient(phone);
        } else if (bookingId) {
            // Link to booking's client directly
            const bookingRes = await query('SELECT client_id FROM bookings WHERE id = $1', [bookingId]);
            if (bookingRes.rows.length > 0) {
                clientId = bookingRes.rows[0].client_id;
            }
        } else {
            // Try to find client from active booking on this table today
            const bookingRes = await query(`
                SELECT b.client_id, b.id as booking_id FROM bookings b
                JOIN booking_time_slots bts ON b.id = bts.booking_id
                JOIN time_slots ts ON bts.time_slot_id = ts.id
                WHERE b.table_id = $1 AND b.status = 'active' 
                AND b.booking_date = CURRENT_DATE
                AND ts.start_time <= CURRENT_TIME + interval '30 minutes'
                ORDER BY ts.start_time ASC
                LIMIT 1
            `, [tableId]);
            if (bookingRes.rows.length > 0) {
                clientId = bookingRes.rows[0].client_id;
                bookingId = bookingRes.rows[0].booking_id;
            }
        }

        // 2. Find existing open order or create new
        let orderId;
        const existingOrderRes = await query("SELECT id FROM orders WHERE table_id = $1 AND status = 'open'", [tableId]);

        if (existingOrderRes.rows.length > 0) {
            orderId = existingOrderRes.rows[0].id;
            if (clientId) {
                await query("UPDATE orders SET client_id = $1 WHERE id = $2 AND client_id IS NULL", [clientId, orderId]);
            }
            if (bookingId) {
                await query("UPDATE orders SET booking_id = $1 WHERE id = $2 AND booking_id IS NULL", [bookingId, orderId]);
            }
        } else {
            const newOrderRes = await query(
                "INSERT INTO orders (table_id, status, client_id, booking_id, phone) VALUES ($1, 'open', $2, $3, $4) RETURNING id", 
                [tableId, clientId, bookingId || null, phone || null]
            );
            orderId = newOrderRes.rows[0].id;
        }

        // Validate stock availability
        const pool = getPool();
        const txClient = await pool.connect();
        
        try {
            await txClient.query('BEGIN');

            // Aggregate required ingredients for the whole order
            const requiredIngredients: Record<number, number> = {};
            for (const item of items as { menu_item_id: number; quantity: number; price: number }[]) {
                const recipeRes = await txClient.query(
                    `SELECT mii.ingredient_id, mii.quantity, mii.recipe_unit, i.unit as stock_unit, i.name as ingredient_name, i.current_stock
                     FROM menu_item_ingredients mii
                     JOIN ingredients i ON mii.ingredient_id = i.id
                     WHERE mii.menu_item_id = $1`,
                    [item.menu_item_id]
                );
                
                for (const row of recipeRes.rows) {
                    const deduct = convertToStockUnit(Number(row.quantity) * item.quantity, row.recipe_unit, row.stock_unit);
                    if (requiredIngredients[row.ingredient_id] === undefined) {
                        requiredIngredients[row.ingredient_id] = 0;
                    }
                    requiredIngredients[row.ingredient_id] = (requiredIngredients[row.ingredient_id] ?? 0) + deduct;
                }
            }

            // Check against current stock
            for (const ingredientId of Object.keys(requiredIngredients)) {
                const id = Number(ingredientId);
                const reqQty = requiredIngredients[id] ?? 0;
                const stockRes = await txClient.query('SELECT name, current_stock FROM ingredients WHERE id = $1', [id]);
                if (stockRes.rows.length > 0) {
                    const stock = Number(stockRes.rows[0].current_stock);
                    if (stock < reqQty) {
                        await txClient.query('ROLLBACK');
                        return c.json({ error: `Недостаточно ингредиента "${stockRes.rows[0].name}" на складе. Требуется: ${reqQty}, в наличии: ${stock}` }, 400);
                    }
                }
            }

            const values = items.flatMap((item: { menu_item_id: number; quantity: number; price: number }, i: number) => [
                orderId, item.menu_item_id, item.quantity, item.price
            ]);
            const placeholders = items.map((_: unknown, i: number) =>
                `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`
            ).join(', ');
            await txClient.query(
                `INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES ${placeholders}`,
                values
            );

            // Auto stock deduction (with unit conversion: recipe_unit → stock_unit)
            for (const item of items as { menu_item_id: number; quantity: number; price: number }[]) {
                const recipeRes = await txClient.query(
                    `SELECT mii.ingredient_id, mii.quantity, mii.recipe_unit, i.unit as stock_unit
                     FROM menu_item_ingredients mii
                     JOIN ingredients i ON mii.ingredient_id = i.id
                     WHERE mii.menu_item_id = $1`,
                    [item.menu_item_id]
                );
                for (const row of recipeRes.rows) {
                    const deduct = convertToStockUnit(Number(row.quantity) * item.quantity, row.recipe_unit, row.stock_unit);
                    await txClient.query(
                        'UPDATE ingredients SET current_stock = GREATEST(0, current_stock - $1) WHERE id = $2',
                        [deduct, row.ingredient_id]
                    );
                    await txClient.query(
                        'INSERT INTO stock_movements (ingredient_id, type, quantity, order_id) VALUES ($1, $2, $3, $4)',
                        [row.ingredient_id, 'usage', -deduct, orderId]
                    );
                }
            }

            await txClient.query(`
                UPDATE orders
                SET total = (SELECT COALESCE(SUM(quantity * price), 0) FROM order_items WHERE order_id = $1)
                WHERE id = $1
            `, [orderId]);

            await txClient.query('COMMIT');
        } catch (txErr) {
            await txClient.query('ROLLBACK');
            throw txErr;
        } finally {
            txClient.release();
        }

        return c.json({ success: true, orderId });
    } catch (err) {
        console.error(err);
        return c.json({ error: 'Failed to place order' }, 500);
    }
};
