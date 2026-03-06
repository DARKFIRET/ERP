import type { Context } from 'hono';
import { query } from '../config/db.js';

export const getStatistics = async (c: Context) => {
    const startDate = c.req.query('startDate');
    const endDate = c.req.query('endDate');

    if (!startDate || !endDate) {
        return c.json({ error: 'startDate and endDate are required' }, 400);
    }

    try {
        const statsQuery = `
            WITH daily_revenue AS (
              SELECT 
                to_char(created_at, 'YYYY-MM-DD') as date,
                SUM(total) as revenue
              FROM orders
              WHERE status != 'cancelled' AND created_at >= $1::timestamp AND created_at < $2::timestamp + interval '1 day'
              GROUP BY to_char(created_at, 'YYYY-MM-DD')
            ),
            daily_dishes AS (
              SELECT
                to_char(o.created_at, 'YYYY-MM-DD') as date,
                SUM(oi.quantity) as dishes
              FROM orders o
              JOIN order_items oi ON o.id = oi.order_id
              WHERE o.status != 'cancelled' AND o.created_at >= $1::timestamp AND o.created_at < $2::timestamp + interval '1 day'
              GROUP BY to_char(o.created_at, 'YYYY-MM-DD')
            )
            SELECT 
              COALESCE(dr.date, dd.date) as date, 
              COALESCE(dr.revenue, 0) as revenue, 
              COALESCE(dd.dishes, 0) as dishes
            FROM daily_revenue dr
            FULL OUTER JOIN daily_dishes dd ON dr.date = dd.date
            ORDER BY date ASC;
        `;

        const res = await query(statsQuery, [startDate, endDate]);
        return c.json(res.rows.map(row => ({
            date: row.date,
            revenue: Number(row.revenue),
            dishes: Number(row.dishes)
        })));
    } catch (err) {
        console.error(err);
        return c.json({ error: 'Failed to fetch statistics' }, 500);
    }
};