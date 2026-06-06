import { Hono } from 'hono';
import { stockPurchase, stockWaste, getStockMovements } from '../controllers/stockController.js';

const stockRoutes = new Hono();

stockRoutes.post('/purchase', stockPurchase);
stockRoutes.post('/waste', stockWaste);
stockRoutes.get('/movements', getStockMovements);

export default stockRoutes;
