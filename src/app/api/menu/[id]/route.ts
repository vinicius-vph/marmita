import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAdminSession, checkOrigin } from '@/lib/auth';
import { logAdminAction } from '@/lib/audit';
import { UUID_REGEX, VALID_CATEGORIES } from '@/lib/constants';
import { uploadImage, deleteImage } from '@/lib/image-upload';
import type { Category } from '@/types';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!checkOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  const formData = await req.formData();
  const name = formData.get('name');
  const description = formData.get('description');
  const price = formData.get('price');
  const meal_date = formData.get('meal_date');
  const imageFile = formData.get('image');
  const existingImageUrl = formData.get('existing_image_url');
  const rawCategory = formData.get('category');

  const category: Category = VALID_CATEGORIES.includes(rawCategory as Category)
    ? (rawCategory as Category)
    : 'meals';

  const supabase = createAdminClient();

  let image_url: string | null = typeof existingImageUrl === 'string' ? existingImageUrl : null;

  if (imageFile instanceof File && imageFile.size > 0) {
    if (typeof existingImageUrl === 'string' && existingImageUrl) {
      await deleteImage(supabase, existingImageUrl);
    }
    const result = await uploadImage(supabase, imageFile);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    image_url = result.url;
  }

  const { data, error } = await supabase
    .from('menu_items')
    .update({
      name: typeof name === 'string' ? name.trim() : undefined,
      description: typeof description === 'string' && description.trim() ? description.trim() : null,
      price: typeof price === 'string' ? parseFloat(price) : undefined,
      meal_date: typeof meal_date === 'string' ? meal_date : undefined,
      image_url,
      category,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Internal server error' }, { status: 500 });

  await logAdminAction('menu.update', req, id, {
    ...(typeof name === 'string' && { name: name.trim() }),
    category,
  });

  return NextResponse.json(data);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!checkOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: item } = await supabase
    .from('menu_items')
    .select('image_url')
    .eq('id', id)
    .single();

  if (item?.image_url) {
    await deleteImage(supabase, item.image_url);
  }

  const { error } = await supabase
    .from('menu_items')
    .update({ active: false })
    .eq('id', id);

  if (error) return NextResponse.json({ error: 'Internal server error' }, { status: 500 });

  await logAdminAction('menu.delete', req, id);

  return NextResponse.json({ success: true });
}
