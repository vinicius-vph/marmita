import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAdminSession, checkOrigin } from '@/lib/auth';
import { logAdminAction } from '@/lib/audit';
import { VALID_CATEGORIES } from '@/lib/constants';
import { uploadImage } from '@/lib/image-upload';
import type { Category } from '@/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get('category');
  const category: Category = VALID_CATEGORIES.includes(raw as Category) ? (raw as Category) : 'meals';

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('active', true)
    .eq('category', category)
    .order('meal_date', { ascending: true });

  if (error) return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!checkOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const formData = await req.formData();
  const name = formData.get('name');
  const description = formData.get('description');
  const price = formData.get('price');
  const meal_date = formData.get('meal_date');
  const reservation_deadline = formData.get('reservation_deadline');
  const imageFile = formData.get('image');
  const rawCategory = formData.get('category');

  if (typeof name !== 'string' || name.trim().length === 0 || typeof price !== 'string' || !price || typeof meal_date !== 'string' || !meal_date) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const category: Category = VALID_CATEGORIES.includes(rawCategory as Category)
    ? (rawCategory as Category)
    : 'meals';

  const supabase = createAdminClient();

  let image_url: string | null = null;
  if (imageFile instanceof File && imageFile.size > 0) {
    const result = await uploadImage(supabase, imageFile);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    image_url = result.url;
  }

  const { data, error } = await supabase
    .from('menu_items')
    .insert({
      name: name.trim(),
      description: typeof description === 'string' && description.trim() ? description.trim() : null,
      price: parseFloat(price),
      meal_date,
      reservation_deadline: typeof reservation_deadline === 'string' && reservation_deadline ? reservation_deadline : null,
      image_url,
      category,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Internal server error' }, { status: 500 });

  await logAdminAction('menu.create', req, data.id, { name: name.trim(), category });

  return NextResponse.json(data, { status: 201 });
}
