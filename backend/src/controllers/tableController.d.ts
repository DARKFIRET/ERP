import type { Context } from 'hono';
export declare const getTables: (c: Context) => Promise<(Response & import("hono").TypedResponse<any[], import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
}, 500, "json">)>;
export declare const updateTableStatus: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    success: true;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
}, 500, "json">)>;
//# sourceMappingURL=tableController.d.ts.map