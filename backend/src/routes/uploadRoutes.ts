import { Hono } from 'hono';
import { uploadFile } from '../controllers/uploadController.js';

const uploadRoutes = new Hono();

uploadRoutes.post('/', uploadFile);

export default uploadRoutes;
