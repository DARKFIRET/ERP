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
      booking_id: number;
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

export interface Ingredient {
  id: number;
  name: string;
  unit: string;
  cost_price: number;
  current_stock: number;
  min_stock: number;
  low_stock: boolean;
}

export interface RecipeItem {
  ingredient_id: number;
  ingredient_name: string;
  stock_unit: string;
  recipe_unit: string;
  quantity: number;
}

export interface MenuAvailability {
  [menuItemId: number]: { can_order: boolean; portions_available: number };
}

export interface StockMovement {
  id: number;
  ingredient_id: number;
  ingredient_name: string;
  unit: string;
  type: 'purchase' | 'usage' | 'waste' | 'adjustment';
  quantity: number;
  reason: string | null;
  created_at: string;
}

export interface MarginItem {
  name: string;
  category: string;
  sold: number;
  revenue: number;
  total_cost: number;
  margin_rub: number;
  margin_pct: number;
}
