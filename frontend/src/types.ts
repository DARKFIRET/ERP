export interface TableData {
  id: number;
  number: number;
  status: 'free' | 'occupied' | 'reserved' | 'dirty';
  x: number;
  y: number;
  seats: number;
  upcoming_booking?: {
      time: string;
      guest_name: string;
      pax: number;
  };
  today_bookings?: {
      time: string;
      guest_name: string;
  }[];
}

export interface TimeSlot {
  id: number;
  start_time: string; // "09:00"
}

export interface BookingData {
  id: number;
  table_id: number;
  guest_name: string;
  phone: string;
  booking_date: string;
  pax: number;
  status?: string;
  slots: { id: number; time: string }[];
}

export interface CreateBookingPayload {
  tableId: number;
  guestName: string;
  phone: string;
  date: string;
  slotIds: number[];
  pax: number;
}

export interface MenuItemData {
  id: number;
  name: string;
  price: number;
  category: string;
  image_url?: string;
}

export interface OrderItem {
  id?: number;
  menu_item_id: number;
  name: string;
  price: number;
  quantity: number;
}

export interface OrderData {
  id: number;
  table_id: number;
  status: string;
  total: number;
  items: OrderItem[];
}
