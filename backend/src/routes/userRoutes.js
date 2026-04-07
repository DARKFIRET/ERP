import { Hono } from 'hono';
import { getUsers, createUser, deleteUser } from '../controllers/userController.js';
import { auth, requireRole } from '../middlewares/auth.js';
const userRoutes = new Hono();
userRoutes.use('*', auth);
userRoutes.use('*', requireRole('manager'));
userRoutes.get('/', getUsers);
userRoutes.post('/', createUser);
userRoutes.delete('/:id', deleteUser);
export default userRoutes;
//# sourceMappingURL=userRoutes.js.map