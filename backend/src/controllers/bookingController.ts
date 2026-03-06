import type { Context } from 'hono';
import { query } from '../config/db.js';

export const getTimeSlots = async (c: Context) => {
  try {
    const res = await query("SELECT id, to_char(start_time, 'HH24:MI') as start_time FROM time_slots ORDER BY start_time ASC");
    return c.json(res.rows);
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Failed to fetch time slots' }, 500);
  }
};

export const createBooking = async (c: Context) => {
  const { tableId, guestName, phone, date, slotIds, pax } = await c.req.json();
  if (!slotIds || slotIds.length === 0) {
      return c.json({ error: 'No slots selected' }, 400);
  }

  try {
    // 1. Get or Create Client
    let clientId: number;
    const clientRes = await query('SELECT id FROM clients WHERE phone = $1', [phone]);
    
    if (clientRes.rows.length > 0) {
        clientId = clientRes.rows[0].id;
        // Optionally update name if provided and was empty
        await query('UPDATE clients SET first_name = COALESCE(first_name, $1) WHERE id = $2', [guestName, clientId]);
    } else {
        const newClientRes = await query(
            'INSERT INTO clients (phone, first_name) VALUES ($1, $2) RETURNING id',
            [phone, guestName]
        );
        clientId = newClientRes.rows[0].id;
    }

    // 2. Check Overlap
    const overlapRes = await query(`
      SELECT 1
      FROM bookings b
      JOIN booking_time_slots bts ON b.id = bts.booking_id
      WHERE b.table_id = $1
      AND b.booking_date = $2
      AND bts.time_slot_id = ANY($3::int[])
      AND b.status != 'cancelled'
    `, [tableId, date, slotIds]);

    if (overlapRes.rows.length > 0) {
      return c.json({ error: 'Selected slots are already booked' }, 409);
    }

    // 3. Create Booking with client_id
    const bookingRes = await query(
      'INSERT INTO bookings (table_id, client_id, guest_name, phone, booking_date, pax) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [tableId, clientId, guestName, phone, date, pax]
    );
    const bookingId = bookingRes.rows[0].id;

    for (const slotId of slotIds) {
        await query('INSERT INTO booking_time_slots (booking_id, time_slot_id) VALUES ($1, $2)', [bookingId, slotId]);
    }

    return c.json({ id: bookingId, success: true }, 201);
  } catch (err: any) {
    console.error(err);
    return c.json({ error: 'Failed to create booking' }, 500);
  }
};

export const getBookings = async (c: Context) => {
  try {
    const res = await query(`
        SELECT
            b.id,
            b.table_id,
            COALESCE(c.first_name, b.guest_name) as guest_name,
            COALESCE(c.phone, b.phone) as phone,
            b.pax,
            b.status,
            to_char(b.booking_date, 'YYYY-MM-DD') as booking_date,
            array_agg(json_build_object('id', ts.id, 'time', to_char(ts.start_time, 'HH24:MI'))) as slots
        FROM bookings b
        LEFT JOIN clients c ON b.client_id = c.id
        JOIN booking_time_slots bts ON b.id = bts.booking_id
        JOIN time_slots ts ON bts.time_slot_id = ts.id
        WHERE b.status = 'active' OR b.status IS NULL
        GROUP BY b.id, c.first_name, c.phone
        ORDER BY b.booking_date DESC, MIN(ts.start_time) ASC
        LIMIT 50
    `);
    return c.json(res.rows);
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Failed to fetch bookings' }, 500);
  }
};

export const updateBookingStatus = async (c: Context) => {
    const id = c.req.param('id');
    const { status } = await c.req.json();
    try {
        await query('UPDATE bookings SET status = $1 WHERE id = $2', [status, id]);
        
        // If booking is closed or cancelled, we might want to free up the table if we were changing table status based on it, 
        // but currently table status is manually managed or dynamic.
        
        return c.json({ success: true });
    } catch (err) {
        console.error(err);
        return c.json({ error: 'Failed to update booking status' }, 500);
    }
};
