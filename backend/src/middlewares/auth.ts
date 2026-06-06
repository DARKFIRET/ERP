import type { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';
import type { Variables } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) throw new Error('JWT_SECRET environment variable is required');

export const auth = async (c: Context<{ Variables: Variables }>, next: Next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return c.json({ error: 'Invalid authorization format' }, 401);
    }
    const token = parts[1] as string;
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
