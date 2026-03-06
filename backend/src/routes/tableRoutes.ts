import { Hono } from 'hono';
import { getTables, updateTableStatus } from '../controllers/tableController.js';

const tableRoutes = new Hono();

tableRoutes.get('/', getTables);
tableRoutes.put('/:id/status', updateTableStatus);

export default tableRoutes;
