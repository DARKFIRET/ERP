import { Hono } from 'hono';
import type { Variables } from './types/index.js';
declare const app: Hono<{
    Variables: Variables;
}, import("hono/types").BlankSchema, "/">;
export default app;
//# sourceMappingURL=app.d.ts.map