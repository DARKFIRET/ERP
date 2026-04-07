import { Hono } from 'hono';
import { getBookings, createBooking, updateBookingStatus } from '../controllers/bookingController.js';
const bookingRoutes = new Hono();
bookingRoutes.get('/', getBookings);
bookingRoutes.post('/', createBooking);
bookingRoutes.put('/:id/status', updateBookingStatus);
export default bookingRoutes;
//# sourceMappingURL=bookingRoutes.js.map