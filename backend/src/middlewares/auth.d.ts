import type { Context, Next } from 'hono';
import type { Variables } from '../types/index.js';
export declare const auth: (c: Context<{
    Variables: Variables;
}>, next: Next) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 401, "json">) | undefined>;
export declare const requireRole: (role: string) => (c: Context<{
    Variables: Variables;
}>, next: Next) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 403, "json">) | undefined>;
//# sourceMappingURL=auth.d.ts.map