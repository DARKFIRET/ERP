import type { Context } from 'hono';
export declare const getOrders: (c: Context) => Promise<(Response & import("hono").TypedResponse<any[], import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
}, 500, "json">)>;
export declare const updateOrderStatus: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    success: true;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
}, 500, "json">)>;
export declare const getActiveOrder: (c: Context) => Promise<Response & import("hono").TypedResponse<any, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
export declare const createOrder: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    success: true;
    orderId: any;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
}, 500, "json">)>;
//# sourceMappingURL=orderController.d.ts.map