import type { Context } from 'hono';
import { query } from '../config/db.js';
import bcrypt from 'bcryptjs';

export const getUsers = async (c: Context) => {
    try {
        const res = await query(`
            SELECT u.id, u.username, u.first_name, u.last_name, r.name as role, r.id as role_id, u.created_at
            FROM users u
            JOIN roles r ON u.role_id = r.id
            ORDER BY u.username
        `);
        return c.json(res.rows);
    } catch (err) {
        return c.json({ error: 'Failed to fetch users' }, 500);
    }
};

export const createUser = async (c: Context) => {
    const { username, password, role_id, first_name, last_name } = await c.req.json();
    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        await query(
            'INSERT INTO users (username, password_hash, role_id, first_name, last_name) VALUES ($1, $2, $3, $4, $5)',
            [username, hash, role_id, first_name, last_name]
        );
        return c.json({ success: true });
    } catch (err) {
        console.error(err);
        return c.json({ error: 'Failed to create user' }, 500);
    }
};

export const deleteUser = async (c: Context) => {
    const id = c.req.param('id');
    try {
        await query('DELETE FROM users WHERE id = $1', [id]);
        return c.json({ success: true });
    } catch (err) {
        return c.json({ error: 'Failed to delete user' }, 500);
    }
};

export const getShifts = async (c: Context) => {
    try {
        const res = await query(`
            SELECT s.id, s.start_time, s.end_time, u.username
            FROM shifts s
            JOIN users u ON s.user_id = u.id
            ORDER BY s.start_time DESC
        `);
        return c.json(res.rows);
    } catch (err) {
        return c.json({ error: 'Failed to fetch shifts' }, 500);
    }
};

export const createShift = async (c: Context) => {
    const { userId, start, end } = await c.req.json();
    try {
        await query('INSERT INTO shifts (user_id, start_time, end_time) VALUES ($1, $2, $3)', [userId, start, end]);
        return c.json({ success: true });
    } catch (err) {
        return c.json({ error: 'Failed to create shift' }, 500);
    }
};
