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
import type { Variables } from './types/index.js';

const app = new Hono<{ Variables: Variables }>();

app.use('*', cors());

// Serve uploaded images
app.use('/storage/*', serveStatic({ root: './' }));

app.get('/', (c) => c.text('Cafe ERP Backend is running!'));

app.route('/', authRoutes);
app.route('/users', userRoutes);
app.route('/shifts', shiftRoutes);
app.route('/tables', tableRoutes);
app.route('/bookings', bookingRoutes);
app.route('/time-slots', timeSlotRoutes);
app.route('/menu', menuRoutes);
app.route('/orders', orderRoutes);
app.route('/upload', uploadRoutes);
app.route('/client', clientRoutes);
app.route('/stats', statsRoutes);

export default app;
