import { Hono } from 'hono';
import { getStatistics, getMargins } from '../controllers/statsController.js';

const statsRoutes = new Hono();

statsRoutes.get('/', getStatistics);
statsRoutes.get('/margins', getMargins);

export default statsRoutes;