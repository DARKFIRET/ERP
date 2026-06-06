import type { Context } from 'hono';
import { query } from '../config/db.js';

export const getTables = async (c: Context) => {
  try {
    const res = await query(`
      SELECT
        t.*,
        (
          SELECT json_build_object('time', to_char(ts.start_time, 'HH24:MI'), 'guest_name', b.guest_name, 'pax', b.pax)
          FROM bookings b
          JOIN booking_time_slots bts ON b.id = bts.booking_id
          JOIN time_slots ts ON bts.time_slot_id = ts.id
          WHERE b.table_id = t.id
          AND b.booking_date = CURRENT_DATE
          AND ts.start_time >= CURRENT_TIME
          ORDER BY ts.start_time ASC
          LIMIT 1
        ) as upcoming_booking,
        (
            SELECT COALESCE(json_agg(json_build_object('time', to_char(ts.start_time, 'HH24:MI'), 'guest_name', b.guest_name, 'booking_id', b.id)), '[]')
            FROM bookings b
            JOIN booking_time_slots bts ON b.id = bts.booking_id
            JOIN time_slots ts ON bts.time_slot_id = ts.id
            WHERE b.table_id = t.id
            AND b.booking_date = CURRENT_DATE
            AND b.status = 'active'
        ) as today_bookings
      FROM tables t
      ORDER BY t.number ASC
    `);
    return c.json(res.rows);
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Failed to fetch tables' }, 500);
  }
};

export const updateTableStatus = async (c: Context) => {
  const id = c.req.param('id');
  const { status } = await c.req.json();
  try {
    await query('UPDATE tables SET status = $1 WHERE id = $2', [status, id]);

    if (status === 'dirty' || status === 'free') {
        const orderRes = await query("SELECT id, booking_id FROM orders WHERE table_id = $1 AND status != 'closed'", [id]);
        if (orderRes.rows.length > 0) {
            const orderIds = orderRes.rows.map((o: { id: number }) => o.id);
            await query("UPDATE orders SET status = 'closed' WHERE id = ANY($1)", [orderIds]);
            const bookingIds = orderRes.rows.map((o: { booking_id: number | null }) => o.booking_id).filter(Boolean);
            if (bookingIds.length > 0) {
                await query("UPDATE bookings SET status = 'completed' WHERE id = ANY($1)", [bookingIds]);
            }
        }
    }

    return c.json({ success: true });
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Failed to update table status' }, 500);
  }
};
