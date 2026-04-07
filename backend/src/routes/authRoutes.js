import { Hono } from 'hono';
import { login, getRoles } from '../controllers/authController.js';
import { auth } from '../middlewares/auth.js';
const authRoutes = new Hono();
authRoutes.post('/login', login);
authRoutes.get('/roles', getRoles);
export default authRoutes;
//# sourceMappingURL=authRoutes.js.map