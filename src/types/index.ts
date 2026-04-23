export type Category = 'meals' | 'breakfast';
export type PaymentMethod = 'mbway' | 'cash' | 'transfer';

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  meal_date: string;
  active: boolean;
  image_url: string | null;
  reservation_deadline: string | null;
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
  payment_method: PaymentMethod;
  cancelled: boolean;
  created_at: string;
}

export interface ReservationWithMenu extends Reservation {
  menu_items: Pick<MenuItem, 'name' | 'meal_date' | 'price' | 'category'>;
}

export interface FundraisingSummary {
  category: Category;
  goal: number;
  label: string;
  raised: number;
  remaining: number;
}

export interface MonthlyFundraising {
  month: string; // 'YYYY-MM'
  total: number;
}

export interface ReservationFormData {
  customer_name: string;
  customer_phone: string;
  quantity: number;
  menu_item_id: string;
  payment_method: PaymentMethod;
}
