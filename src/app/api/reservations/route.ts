import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAdminSession } from '@/lib/auth';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_QTY = 100;
const MAX_BODY = 5_000; // 5 KB is ample for a reservation payload

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('reservations')
    .select('*, menu_items(name, meal_date, price)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  // SEC-13: enforce body size limit before parsing
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

  const { menu_item_id, customer_name, customer_phone, quantity } = body;

  if (!menu_item_id || !customer_name || !customer_phone || !quantity) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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
    .select('id, price, active')
    .eq('id', menu_item_id)
    .single();

  if (menuError || !menuItem) {
    return NextResponse.json({ error: 'Menu item not found' }, { status: 400 });
  }
  if (!menuItem.active) {
    return NextResponse.json({ error: 'Menu item unavailable' }, { status: 400 });
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
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ...data, total_amount }, { status: 201 });
}
