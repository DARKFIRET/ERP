import type { Context } from 'hono';
import { query } from '../config/db.js';

export const getMenu = async (c: Context) => {
    try {
        const res = await query('SELECT * FROM menu_items ORDER BY category, name');
        return c.json(res.rows);
    } catch (err) {
        return c.json({ error: 'Failed to fetch menu' }, 500);
    }
};

export const createMenuItem = async (c: Context) => {
    const { name, price, category, image_url } = await c.req.json();
    try {
        await query(
            'INSERT INTO menu_items (name, price, category, image_url) VALUES ($1, $2, $3, $4)',
            [name, price, category, image_url || null]
        );
        return c.json({ success: true }, 201);
    } catch (err) {
        console.error('Error adding menu item:', err);
        return c.json({ error: 'Failed to add menu item' }, 500);
    }
};

export const updateMenuItem = async (c: Context) => {
    const id = c.req.param('id');
    const { name, price, category, image_url } = await c.req.json();
    try {
        await query(
            'UPDATE menu_items SET name = $1, price = $2, category = $3, image_url = $4 WHERE id = $5',
            [name, price, category, image_url || null, id]
        );
        return c.json({ success: true });
    } catch (err) {
        console.error('Error updating menu item:', err);
        return c.json({ error: 'Failed to update menu item' }, 500);
    }
};

export const deleteMenuItem = async (c: Context) => {
    const id = c.req.param('id');
    try {
        await query('DELETE FROM menu_items WHERE id = $1', [id]);
        return c.json({ success: true });
    } catch (err) {
        console.error(err);
        return c.json({ error: 'Failed to delete menu item. It might be part of an order.' }, 500);
    }
};
