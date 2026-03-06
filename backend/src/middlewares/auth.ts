import type { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';
import type { Variables } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export const auth = async (c: Context<{ Variables: Variables }>, next: Next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);

    const token = authHeader.split(' ')[1];
    try {
        const payload = jwt.verify(token, JWT_SECRET) as any;
        c.set('user', payload);
        await next();
    } catch (err) {
        return c.json({ error: 'Invalid token' }, 401);
    }
};

export const requireRole = (role: string) => {
    return async (c: Context<{ Variables: Variables }>, next: Next) => {
        const user = c.get('user');
        if (!user || user.role !== role) {
            return c.json({ error: 'Forbidden' }, 403);
        }
        await next();
    }
}
