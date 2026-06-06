import { Hono } from 'hono';
import { getRecipe, saveRecipe } from '../controllers/recipeController.js';

const recipeRoutes = new Hono();

recipeRoutes.get('/:menuItemId', getRecipe);
recipeRoutes.put('/:menuItemId', saveRecipe);

export default recipeRoutes;
