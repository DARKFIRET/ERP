import type { Context } from 'hono';
export declare const login: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 404, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
}, 401, "json">) | (Response & import("hono").TypedResponse<{
    token: string;
    role: any;
    username: any;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
}, 500, "json">)>;
export declare const getRoles: (c: Context) => Promise<(Response & import("hono").TypedResponse<any[], import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
}, 500, "json">)>;
//# sourceMappingURL=authController.d.ts.map