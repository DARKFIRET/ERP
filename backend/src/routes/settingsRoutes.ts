import { Hono } from 'hono';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { auth, requireRole } from '../middlewares/auth.js';
import type { Variables } from '../types/index.js';

const router = new Hono<{ Variables: Variables }>();

router.get('/', getSettings);
router.put('/', auth, requireRole('manager'), updateSettings);

export default router;
