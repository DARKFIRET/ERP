import { Hono } from 'hono';
import { getMenu, createMenuItem, updateMenuItem, deleteMenuItem } from '../controllers/menuController.js';

const menuRoutes = new Hono();

menuRoutes.get('/', getMenu);
menuRoutes.post('/', createMenuItem);
menuRoutes.put('/:id', updateMenuItem);
menuRoutes.delete('/:id', deleteMenuItem);

export default menuRoutes;
