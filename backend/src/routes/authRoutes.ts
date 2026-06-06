import { Hono } from 'hono';
import { login, getRoles } from '../controllers/authController.js';

const authRoutes = new Hono();

authRoutes.post('/login', login);
authRoutes.get('/roles', getRoles);

export default authRoutes;
