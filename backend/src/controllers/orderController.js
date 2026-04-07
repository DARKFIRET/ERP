import { query } from '../config/db.js';
export const getOrders = async (c) => {
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
            WHERE 1=1
        `;
        const params = [];
        if (status) {
            queryText += ` AND o.status = $1`;
            params.push(status);
        }
        else {
            queryText += ` AND o.status IN ('open', 'cooking', 'ready', 'served')`;
        }
        queryText += ` GROUP BY o.id, t.number, c.first_name ORDER BY o.created_at ASC`;
        const res = await query(queryText, params);
        return c.json(res.rows);
    }
    catch (err) {
        console.error(err);
        return c.json({ error: 'Failed to fetch orders' }, 500);
    }
};
export const updateOrderStatus = async (c) => {
    const id = c.req.param('id');
    const { status } = await c.req.json();
    try {
        await query('UPDATE orders SET status = $1 WHERE id = $2', [status, id]);
        return c.json({ success: true });
    }
    catch (err) {
        console.error(err);
        return c.json({ error: 'Failed to update order status' }, 500);
    }
};
export const getActiveOrder = async (c) => {
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
        if (res.rows.length === 0)
            return c.json(null);
        return c.json(res.rows[0]);
    }
    catch (err) {
        return c.json({ error: 'Failed to fetch active order' }, 500);
    }
};
export const createOrder = async (c) => {
    const { tableId, items, phone } = await c.req.json(); // items: { menu_item_id, quantity, price }[]
    try {
        // 1. Get or Create Client
        let clientId = null;
        if (phone) {
            const clientRes = await query('SELECT id FROM clients WHERE phone = $1', [phone]);
            if (clientRes.rows.length > 0) {
                clientId = clientRes.rows[0].id;
            }
            else {
                const newClientRes = await query('INSERT INTO clients (phone, first_name) VALUES ($1, $2) RETURNING id', [phone, 'Гость']);
                clientId = newClientRes.rows[0].id;
            }
        }
        else {
            // Try to find client from active booking on this table
            const bookingRes = await query(`
                SELECT client_id FROM bookings 
                WHERE table_id = $1 AND status = 'active' 
                AND booking_date = CURRENT_DATE
                LIMIT 1
            `, [tableId]);
            if (bookingRes.rows.length > 0) {
                clientId = bookingRes.rows[0].client_id;
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
        }
        else {
            const newOrderRes = await query("INSERT INTO orders (table_id, status, client_id, phone) VALUES ($1, 'open', $2, $3) RETURNING id", [tableId, clientId, phone || null]);
            orderId = newOrderRes.rows[0].id;
        }
        // Add items
        for (const item of items) {
            await query("INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES ($1, $2, $3, $4)", [orderId, item.menu_item_id, item.quantity, item.price]);
        }
        // Update total
        await query(`
            UPDATE orders
            SET total = (SELECT COALESCE(SUM(quantity * price), 0) FROM order_items WHERE order_id = $1)
            WHERE id = $1
        `, [orderId]);
        return c.json({ success: true, orderId });
    }
    catch (err) {
        console.error(err);
        return c.json({ error: 'Failed to place order' }, 500);
    }
};
//# sourceMappingURL=orderController.js.map