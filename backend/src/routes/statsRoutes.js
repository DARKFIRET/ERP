import { Hono } from 'hono';
import { getStatistics } from '../controllers/statsController.js';
const statsRoutes = new Hono();
statsRoutes.get('/', getStatistics);
export default statsRoutes;
//# sourceMappingURL=statsRoutes.js.map