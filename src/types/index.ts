export type Category = 'meals' | 'breakfast';

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  meal_date: string;
  active: boolean;
  image_url: string | null;
  created_at: string;
  category: Category;
}

export interface Reservation {
  id: string;
  menu_item_id: string;
  customer_name: string;
  customer_phone: string;
  quantity: number;
  total_amount: number;
  paid: boolean;
  paid_at: string | null;
  created_at: string;
}

export interface ReservationWithMenu extends Reservation {
  menu_items: Pick<MenuItem, 'name' | 'meal_date' | 'price'>;
}

export interface FundraisingSummary {
  category: Category;
  goal: number;
  label: string;
  raised: number;
  remaining: number;
}

export interface ReservationFormData {
  customer_name: string;
  customer_phone: string;
  quantity: number;
  menu_item_id: string;
}
