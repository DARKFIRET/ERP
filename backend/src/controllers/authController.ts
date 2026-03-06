import type { Context } from 'hono';
import { query } from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export const login = async (c: Context) => {
    const { username, password } = await c.req.json();
    try {
        const res = await query(`
            SELECT u.*, r.name as role_name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.username = $1
        `, [username]);

        if (res.rows.length === 0) return c.json({ error: 'User not found' }, 404);

        const user = res.rows[0];
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return c.json({ error: 'Invalid password' }, 401);

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role_name }, JWT_SECRET, { expiresIn: '8h' });
        return c.json({ token, role: user.role_name, username: user.username });
    } catch (err) {
        console.error(err);
        return c.json({ error: 'Login failed' }, 500);
    }
};

export const getRoles = async (c: Context) => {
    try {
        const res = await query('SELECT id, name FROM roles ORDER BY name');
        console.log('Fetched roles:', res.rows);
        return c.json(res.rows);
    } catch (err) {
        console.error('Error fetching roles:', err);
        return c.json({ error: 'Failed to fetch roles' }, 500);
    }
};
