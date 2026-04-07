import { serve } from '@hono/node-server';
import app from './app.js';
import { seedDatabase } from './utils/seed.js';
const port = 3000;
console.log(`Server is running on port ${port}`);
seedDatabase().then(() => {
    serve({
        fetch: app.fetch,
        port
    });
});
//# sourceMappingURL=index.js.map