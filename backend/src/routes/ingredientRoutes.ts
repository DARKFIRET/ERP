import { Hono } from 'hono';
import { getIngredients, getLowStock, createIngredient, updateIngredient, deleteIngredient } from '../controllers/ingredientController.js';

const ingredientRoutes = new Hono();

ingredientRoutes.get('/', getIngredients);
ingredientRoutes.get('/low-stock', getLowStock);
ingredientRoutes.post('/', createIngredient);
ingredientRoutes.put('/:id', updateIngredient);
ingredientRoutes.delete('/:id', deleteIngredient);

export default ingredientRoutes;
