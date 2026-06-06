import { Hono } from 'hono';
import { getClientHistory, sendOtp, verifyOtp } from '../controllers/clientController.js';

const clientRoutes = new Hono();

clientRoutes.post('/send-otp', sendOtp);
clientRoutes.post('/verify-otp', verifyOtp);
clientRoutes.get('/history', getClientHistory);

export default clientRoutes;