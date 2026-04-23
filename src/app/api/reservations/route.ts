import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAdminSession, checkOrigin } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { UUID_REGEX } from '@/lib/constants';
import type { PaymentMethod } from '@/types';

const VALID_PAYMENT_METHODS: PaymentMethod[] = ['mbway', 'cash', 'transfer'];

const MAX_QTY = 100;
const MAX_BODY = 5_000; // 5 KB is ample for a reservation payload

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('reservations')
    .select('*, menu_items(name, meal_date, price, category)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  if (!checkOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const ip = getClientIp(req);
  const rateLimit = await checkRateLimit(`reservation:${ip}`, 20);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } }
    );
  }

  const text = await req.text();
  if (text.length > MAX_BODY) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { menu_item_id, customer_name, customer_phone, quantity, payment_method } = body;

  if (!menu_item_id || !customer_name || !customer_phone || !quantity || !payment_method) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (!VALID_PAYMENT_METHODS.includes(payment_method as PaymentMethod)) {
    return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
  }

  if (typeof menu_item_id !== 'string' || !UUID_REGEX.test(menu_item_id)) {
    return NextResponse.json({ error: 'Invalid menu item' }, { status: 400 });
  }

  if (typeof customer_name !== 'string' || customer_name.trim().length === 0 || customer_name.length > 255) {
    return NextResponse.json({ error: 'Invalid customer name' }, { status: 400 });
  }

  if (typeof customer_phone !== 'string' || customer_phone.trim().length === 0 || customer_phone.length > 50) {
    return NextResponse.json({ error: 'Invalid customer phone' }, { status: 400 });
  }

  const qty = parseInt(String(quantity), 10);
  if (isNaN(qty) || qty < 1 || qty > MAX_QTY) {
    return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: menuItem, error: menuError } = await supabase
    .from('menu_items')
    .select('id, price, active, reservation_deadline')
    .eq('id', menu_item_id)
    .single();

  if (menuError || !menuItem) {
    return NextResponse.json({ error: 'Menu item not found' }, { status: 400 });
  }
  if (!menuItem.active) {
    return NextResponse.json({ error: 'Menu item unavailable' }, { status: 400 });
  }
  if (menuItem.reservation_deadline) {
    const today = new Date().toISOString().split('T')[0];
    if (today > menuItem.reservation_deadline) {
      return NextResponse.json({ error: 'Reservation deadline passed' }, { status: 400 });
    }
  }

  const total_amount = menuItem.price * qty;

  const { data, error } = await supabase
    .from('reservations')
    .insert({
      menu_item_id,
      customer_name: customer_name.trim(),
      customer_phone: customer_phone.trim(),
      quantity: qty,
      total_amount,
      payment_method: payment_method as PaymentMethod,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  return NextResponse.json({ ...data, total_amount }, { status: 201 });
}
