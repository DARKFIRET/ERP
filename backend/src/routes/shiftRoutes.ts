import { Hono } from 'hono';
import { getShifts, createShift } from '../controllers/userController.js';
import { auth, requireRole } from '../middlewares/auth.js';

const shiftRoutes = new Hono();

shiftRoutes.use('*', auth);
shiftRoutes.use('*', requireRole('manager'));

shiftRoutes.get('/', getShifts);
shiftRoutes.post('/', createShift);

export default shiftRoutes;
