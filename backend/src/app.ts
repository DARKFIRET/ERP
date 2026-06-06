import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { cors } from 'hono/cors';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import shiftRoutes from './routes/shiftRoutes.js';
import tableRoutes from './routes/tableRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import timeSlotRoutes from './routes/timeSlotRoutes.js';
import menuRoutes from './routes/menuRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import ingredientRoutes from './routes/ingredientRoutes.js';
import recipeRoutes from './routes/recipeRoutes.js';
import stockRoutes from './routes/stockRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import { getMenuAvailability } from './controllers/recipeController.js';
import type { Variables } from './types/index.js';

const app = new Hono<{ Variables: Variables }>();

app.use('*', cors());

// Serve uploaded images
app.use('/storage/*', serveStatic({ root: './' }));

app.get('/', (c) => c.text('Cafe ERP Backend is running!'));

app.route('/api', authRoutes);
app.route('/api/users', userRoutes);
app.route('/api/shifts', shiftRoutes);
app.route('/api/tables', tableRoutes);
app.route('/api/bookings', bookingRoutes);
app.route('/api/time-slots', timeSlotRoutes);
app.get('/api/menu/availability', getMenuAvailability);
app.route('/api/menu', menuRoutes);
app.route('/api/orders', orderRoutes);
app.route('/api/upload', uploadRoutes);
app.route('/api/client', clientRoutes);
app.route('/api/stats', statsRoutes);
app.route('/api/ingredients', ingredientRoutes);
app.route('/api/recipes', recipeRoutes);
app.route('/api/stock', stockRoutes);
app.route('/api/settings', settingsRoutes);

export default app;
