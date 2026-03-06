import type { TableData, BookingData, CreateBookingPayload, TimeSlot, MenuItemData, OrderData } from './types';

const API_URL = 'http://localhost:3000';

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

export const createOrder = async (tableId: number, items: { menu_item_id: number, quantity: number, price: number }[], phone?: string) => {
    const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId, items, phone })
    });
    if (!response.ok) throw new Error('Failed to place order');
    return response.json();
};
