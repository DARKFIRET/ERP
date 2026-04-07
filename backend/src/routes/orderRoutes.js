import { Hono } from 'hono';
import { getOrders, createOrder, updateOrderStatus, getActiveOrder } from '../controllers/orderController.js';
const orderRoutes = new Hono();
orderRoutes.get('/', getOrders);
orderRoutes.post('/', createOrder);
orderRoutes.put('/:id/status', updateOrderStatus);
orderRoutes.get('/active/:tableId', getActiveOrder);
export default orderRoutes;
//# sourceMappingURL=orderRoutes.js.map