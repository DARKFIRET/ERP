import type { Context } from 'hono';
export declare const getTimeSlots: (c: Context) => Promise<(Response & import("hono").TypedResponse<any[], import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
}, 500, "json">)>;
export declare const createBooking: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
}, 409, "json">) | (Response & import("hono").TypedResponse<{
    id: any;
    success: true;
}, 201, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
}, 500, "json">)>;
export declare const getBookings: (c: Context) => Promise<(Response & import("hono").TypedResponse<any[], import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
}, 500, "json">)>;
export declare const updateBookingStatus: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    success: true;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
}, 500, "json">)>;
//# sourceMappingURL=bookingController.d.ts.map