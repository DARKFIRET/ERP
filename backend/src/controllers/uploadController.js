import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
export const uploadFile = async (c) => {
    try {
        const body = await c.req.parseBody();
        const file = body['file'];
        if (!file || typeof file === 'string') {
            return c.json({ error: 'No file uploaded' }, 400);
        }
        const buffer = await file.arrayBuffer();
        const filename = `${uuidv4()}_${file.name}`;
        const uploadPath = path.join(process.cwd(), 'storage', filename);
        // Ensure storage directory exists
        if (!fs.existsSync(path.dirname(uploadPath))) {
            fs.mkdirSync(path.dirname(uploadPath), { recursive: true });
        }
        fs.writeFileSync(uploadPath, Buffer.from(buffer));
        const imageUrl = `http://localhost:3000/storage/${filename}`;
        return c.json({ url: imageUrl });
    }
    catch (err) {
        console.error(err);
        return c.json({ error: 'Failed to upload file' }, 500);
    }
};
//# sourceMappingURL=uploadController.js.map