import type { Context } from 'hono';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export const uploadFile = async (c: Context) => {
    try {
        const body = await c.req.parseBody();
        const file = body['file'];

        if (!file || typeof file === 'string') {
            return c.json({ error: 'No file uploaded' }, 400);
        }

        if (!ALLOWED_TYPES.includes((file as File).type)) {
            return c.json({ error: 'Invalid file type' }, 400);
        }

        if ((file as File).size > MAX_SIZE) {
            return c.json({ error: 'File too large' }, 400);
        }

        const buffer = await (file as File).arrayBuffer();
        const originalName = path.basename((file as File).name).replace(/[^a-zA-Z0-9._-]/g, '_');
        const filename = `${uuidv4()}_${originalName}`;
        const storageDir = path.join(process.cwd(), 'storage');
        const uploadPath = path.join(storageDir, filename);

        await fs.mkdir(storageDir, { recursive: true });
        await fs.writeFile(uploadPath, Buffer.from(buffer));

        return c.json({ url: `/storage/${filename}` });
    } catch (err) {
        console.error(err);
        return c.json({ error: 'Failed to upload file' }, 500);
    }
};
