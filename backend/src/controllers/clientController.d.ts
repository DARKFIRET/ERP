import type { Context } from 'hono';
export declare const getClientHistory: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    guestName: any;
    bookings: any[];
    orders: any[];
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
}, 500, "json">)>;
//# sourceMappingURL=clientController.d.ts.map