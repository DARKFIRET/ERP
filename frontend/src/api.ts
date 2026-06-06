import type { TableData, BookingData, CreateBookingPayload, TimeSlot, MenuItemData, OrderData, Ingredient, RecipeItem, MenuAvailability, StockMovement, MarginItem } from './types';

const API_URL = '/api';

export const fetchTables = async (): Promise<TableData[]> => {
  const response = await fetch(`${API_URL}/tables`);
  if (!response.ok) {
    throw new Error('Failed to fetch tables');
  }
  return response.json();
};

export const fetchTimeSlots = async (): Promise<TimeSlot[]> => {
  const response = await fetch(`${API_URL}/time-slots`);
  if (!response.ok) {
    throw new Error('Failed to fetch time slots');
  }
  return response.json();
};

export const fetchBookings = async (): Promise<BookingData[]> => {
  const response = await fetch(`${API_URL}/bookings`);
  if (!response.ok) {
    throw new Error('Failed to fetch bookings');
  }
  return response.json();
};

export const createBooking = async (payload: CreateBookingPayload): Promise<BookingData> => {
  const response = await fetch(`${API_URL}/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error('Failed to create booking');
  }
  return response.json();
};

export const updateBookingStatus = async (id: number, status: string): Promise<void> => {
  const response = await fetch(`${API_URL}/bookings/${id}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    throw new Error('Failed to update booking status');
  }
};

export const fetchMenu = async (): Promise<MenuItemData[]> => {
    const response = await fetch(`${API_URL}/menu`);
    if (!response.ok) throw new Error('Failed to fetch menu');
    return response.json();
};

export const fetchClientHistory = async (phone: string) => {
    const response = await fetch(`${API_URL}/client/history?phone=${encodeURIComponent(phone)}`);
    if (!response.ok) throw new Error('Failed to fetch client history');
    return response.json();
};

export const sendOtp = async (phone: string): Promise<void> => {
    const res = await fetch(`${API_URL}/client/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
    });
    if (!res.ok) throw new Error('Failed to send OTP');
    const data = await res.json();
    if (data.code) console.log(`%c[OTP] Код: ${data.code}`, 'color: #2196f3; font-size: 16px; font-weight: bold;');
};

export const verifyOtp = async (phone: string, code: string): Promise<void> => {
    const res = await fetch(`${API_URL}/client/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Invalid code');
    }
};

export const fetchStatistics = async (startDate: string, endDate: string) => {
    const response = await fetch(`${API_URL}/stats?startDate=${startDate}&endDate=${endDate}`);
    if (!response.ok) throw new Error('Failed to fetch statistics');
    return response.json();
};

export const fetchActiveOrder = async (tableId: number): Promise<OrderData | null> => {
    const response = await fetch(`${API_URL}/orders/active/${tableId}`);
    if (!response.ok) throw new Error('Failed to fetch order');
    return response.json();
};

export const createOrder = async (tableId: number, items: { menu_item_id: number, quantity: number, price: number }[], phone?: string, bookingId?: number | null) => {
    const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId, items, phone, bookingId: bookingId || undefined })
    });
    if (!response.ok) throw new Error('Failed to place order');
    return response.json();
};

export const fetchIngredients = async (): Promise<Ingredient[]> => {
    const res = await fetch(`${API_URL}/ingredients`);
    if (!res.ok) throw new Error('Failed to fetch ingredients');
    return res.json();
};

export const fetchLowStock = async (): Promise<Ingredient[]> => {
    const res = await fetch(`${API_URL}/ingredients/low-stock`);
    if (!res.ok) throw new Error('Failed to fetch low stock');
    return res.json();
};

export const createIngredient = async (data: Omit<Ingredient, 'id' | 'low_stock' | 'created_at'>): Promise<Ingredient> => {
    const res = await fetch(`${API_URL}/ingredients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create ingredient');
    return res.json();
};

export const updateIngredient = async (id: number, data: Omit<Ingredient, 'id' | 'low_stock' | 'created_at'>): Promise<Ingredient> => {
    const res = await fetch(`${API_URL}/ingredients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update ingredient');
    return res.json();
};

export const deleteIngredient = async (id: number): Promise<void> => {
    const res = await fetch(`${API_URL}/ingredients/${id}`, { method: 'DELETE' });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to delete ingredient');
    }
};

export const fetchRecipe = async (menuItemId: number): Promise<RecipeItem[]> => {
    const res = await fetch(`${API_URL}/recipes/${menuItemId}`);
    if (!res.ok) throw new Error('Failed to fetch recipe');
    return res.json();
};

export const saveRecipe = async (menuItemId: number, items: { ingredient_id: number; quantity: number; recipe_unit: string }[]): Promise<void> => {
    const res = await fetch(`${API_URL}/recipes/${menuItemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items)
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to save recipe');
    }
};

export const fetchMenuAvailability = async (): Promise<MenuAvailability> => {
    const res = await fetch(`${API_URL}/menu/availability`);
    if (!res.ok) throw new Error('Failed to fetch availability');
    return res.json();
};

export const stockPurchase = async (ingredient_id: number, quantity: number, reason?: string): Promise<void> => {
    const res = await fetch(`${API_URL}/stock/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredient_id, quantity, reason })
    });
    if (!res.ok) throw new Error('Failed to record purchase');
};

export const stockWaste = async (ingredient_id: number, quantity: number, reason: string): Promise<void> => {
    const res = await fetch(`${API_URL}/stock/waste`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredient_id, quantity, reason })
    });
    if (!res.ok) throw new Error('Failed to record waste');
};

export const fetchStockMovements = async (params?: { ingredient_id?: number; type?: string; from?: string; to?: string; limit?: number }): Promise<StockMovement[]> => {
    const qs = new URLSearchParams();
    if (params?.ingredient_id) qs.set('ingredient_id', String(params.ingredient_id));
    if (params?.type) qs.set('type', params.type);
    if (params?.from) qs.set('from', params.from);
    if (params?.to) qs.set('to', params.to);
    if (params?.limit) qs.set('limit', String(params.limit));
    const res = await fetch(`${API_URL}/stock/movements?${qs}`);
    if (!res.ok) throw new Error('Failed to fetch movements');
    return res.json();
};

export const fetchMargins = async (startDate: string, endDate: string): Promise<{ by_item: MarginItem[]; by_category: { category: string; revenue: number; total_cost: number; margin_pct: number }[]; total: { revenue: number; total_cost: number; margin_pct: number } }> => {
    const res = await fetch(`${API_URL}/stats/margins?startDate=${startDate}&endDate=${endDate}`);
    if (!res.ok) throw new Error('Failed to fetch margins');
    return res.json();
};
