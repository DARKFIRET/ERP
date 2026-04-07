import { Hono } from 'hono';
import { getTimeSlots } from '../controllers/bookingController.js';
const timeSlotRoutes = new Hono();
timeSlotRoutes.get('/', getTimeSlots);
export default timeSlotRoutes;
//# sourceMappingURL=timeSlotRoutes.js.map