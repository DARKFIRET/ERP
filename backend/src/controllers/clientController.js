import { query } from '../config/db.js';
export const getClientHistory = async (c) => {
    const phone = c.req.query('phone');
    if (!phone) {
        return c.json({ error: 'Phone is required' }, 400);
    }
    try {
        // 1. Get Client ID
        const clientLookup = await query('SELECT id, first_name FROM clients WHERE phone = $1', [phone]);
        if (clientLookup.rows.length === 0) {
            return c.json({
                guestName: '',
                bookings: [],
                orders: []
            });
        }
        const clientId = clientLookup.rows[0].id;
        const guestName = clientLookup.rows[0].first_name;
        // 2. Get bookings by client_id (or legacy phone if client_id is null)
        const bookingsRes = await query(`
            SELECT
                b.id,
                b.table_id,
                t.number as table_number,
                COALESCE(c.first_name, b.guest_name) as guest_name,
                b.pax,
                to_char(b.booking_date, 'YYYY-MM-DD') as booking_date,
                array_agg(json_build_object('id', ts.id, 'time', to_char(ts.start_time, 'HH24:MI'))) as slots
            FROM bookings b
            JOIN tables t ON b.table_id = t.id
            LEFT JOIN clients c ON b.client_id = c.id
            LEFT JOIN booking_time_slots bts ON b.id = bts.booking_id
            LEFT JOIN time_slots ts ON bts.time_slot_id = ts.id
            WHERE b.client_id = $1 OR (b.client_id IS NULL AND b.phone = $2)
            GROUP BY b.id, t.number, c.first_name
            ORDER BY b.booking_date DESC
        `, [clientId, phone]);
        // 3. Get orders by client_id (or legacy phone)
        const ordersRes = await query(`
            SELECT o.*, t.number as table_number,
                   json_agg(json_build_object('id', oi.id, 'name', m.name, 'quantity', oi.quantity, 'price', oi.price)) as items
            FROM orders o
            JOIN tables t ON o.table_id = t.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN menu_items m ON oi.menu_item_id = m.id
            WHERE o.client_id = $1 OR (o.client_id IS NULL AND o.phone = $2)
            GROUP BY o.id, t.number
            ORDER BY o.created_at DESC
        `, [clientId, phone]);
        return c.json({
            guestName,
            bookings: bookingsRes.rows,
            orders: ordersRes.rows
        });
    }
    catch (err) {
        console.error(err);
        return c.json({ error: 'Failed to fetch client history' }, 500);
    }
};
//# sourceMappingURL=clientController.js.map