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

export const getMargins = async (c: Context) => {
    const startDate = c.req.query('startDate');
    const endDate = c.req.query('endDate');

    if (!startDate || !endDate) {
        return c.json({ error: 'startDate and endDate are required' }, 400);
    }

    try {
        const res = await query(`
            SELECT
                m.name,
                m.category,
                SUM(oi.quantity) as sold,
                SUM(oi.quantity * oi.price) as revenue,
                COALESCE(SUM(
                    oi.quantity * (
                        SELECT COALESCE(SUM(
                            CASE
                                WHEN mii.recipe_unit IN ('г', 'мл') THEN mii.quantity / 1000.0 * i.cost_price
                                ELSE mii.quantity * i.cost_price
                            END
                        ), 0)
                        FROM menu_item_ingredients mii
                        JOIN ingredients i ON mii.ingredient_id = i.id
                        WHERE mii.menu_item_id = m.id
                    )
                ), 0) as total_cost
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN menu_items m ON oi.menu_item_id = m.id
            WHERE o.status != 'cancelled'
              AND o.created_at >= $1::timestamp
              AND o.created_at < $2::timestamp + interval '1 day'
            GROUP BY m.id, m.name, m.category
            ORDER BY revenue DESC
        `, [startDate, endDate]);

        const byItem = res.rows.map(row => {
            const revenue = Number(row.revenue);
            const total_cost = Number(row.total_cost);
            const margin_rub = revenue - total_cost;
            const margin_pct = revenue > 0 ? (margin_rub / revenue) * 100 : 0;
            return {
                name: row.name,
                category: row.category,
                sold: Number(row.sold),
                revenue,
                total_cost,
                margin_rub,
                margin_pct: Math.round(margin_pct * 10) / 10
            };
        });

        const categoryMap: Record<string, { revenue: number; total_cost: number }> = {};
        for (const item of byItem) {
            if (!categoryMap[item.category]) categoryMap[item.category] = { revenue: 0, total_cost: 0 };
            const cat = categoryMap[item.category];
            if (cat) {
                cat.revenue += item.revenue;
                cat.total_cost += item.total_cost;
            }
        }
        const byCategory = Object.entries(categoryMap).map(([category, data]) => ({
            category,
            revenue: data.revenue,
            total_cost: data.total_cost,
            margin_pct: data.revenue > 0 ? Math.round(((data.revenue - data.total_cost) / data.revenue) * 1000) / 10 : 0
        }));

        const totalRevenue = byItem.reduce((s, i) => s + i.revenue, 0);
        const totalCost = byItem.reduce((s, i) => s + i.total_cost, 0);

        return c.json({
            by_item: byItem,
            by_category: byCategory,
            total: {
                revenue: totalRevenue,
                total_cost: totalCost,
                margin_pct: totalRevenue > 0 ? Math.round(((totalRevenue - totalCost) / totalRevenue) * 1000) / 10 : 0
            }
        });
    } catch (err) {
        console.error(err);
        return c.json({ error: 'Failed to fetch margins' }, 500);
    }
};