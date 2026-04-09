import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('reservations')
    .select('*, menu_items(name, meal_date, price)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { menu_item_id, customer_name, customer_phone, quantity } = body;

  if (!menu_item_id || !customer_name || !customer_phone || !quantity) {
    return NextResponse.json({ error: 'Campos obrigatórios em falta' }, { status: 400 });
  }

  const qty = parseInt(quantity, 10);
  if (isNaN(qty) || qty < 1) {
    return NextResponse.json({ error: 'Quantidade inválida' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: menuItem, error: menuError } = await supabase
    .from('menu_items')
    .select('id, price, active')
    .eq('id', menu_item_id)
    .single();

  if (menuError || !menuItem) {
    return NextResponse.json({ error: 'Prato não encontrado' }, { status: 400 });
  }
  if (!menuItem.active) {
    return NextResponse.json({ error: 'Prato indisponível' }, { status: 400 });
  }

  const total_amount = menuItem.price * qty;

  const { data, error } = await supabase
    .from('reservations')
    .insert({ menu_item_id, customer_name, customer_phone, quantity: qty, total_amount })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ...data, total_amount }, { status: 201 });
}
