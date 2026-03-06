import { Hono } from 'hono';
import { getClientHistory } from '../controllers/clientController.js';

const clientRoutes = new Hono();

clientRoutes.get('/history', getClientHistory);

export default clientRoutes;