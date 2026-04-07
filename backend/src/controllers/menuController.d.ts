import type { Context } from 'hono';
export declare const getMenu: (c: Context) => Promise<(Response & import("hono").TypedResponse<any[], import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
}, 500, "json">)>;
export declare const createMenuItem: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    success: true;
}, 201, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
}, 500, "json">)>;
export declare const updateMenuItem: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    success: true;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
}, 500, "json">)>;
export declare const deleteMenuItem: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    success: true;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
}, 500, "json">)>;
//# sourceMappingURL=menuController.d.ts.map