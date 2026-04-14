import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAdminSession, checkOrigin } from '@/lib/auth';
import { logAdminAction } from '@/lib/audit';
import type { Category } from '@/types';

const BUCKET = 'menu-images';
const MAX_SIZE = 2 * 1024 * 1024;
const VALID_CATEGORIES: Category[] = ['meals', 'breakfast'];

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function isValidImageBytes(bytes: Uint8Array, mimeType: string): boolean {
  if (mimeType === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimeType === 'image/png') return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (mimeType === 'image/webp') return bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  return false;
}

async function uploadImage(
  supabase: ReturnType<typeof createAdminClient>,
  file: File
): Promise<{ url: string | null; error?: string }> {
  if (file.size > MAX_SIZE) return { url: null, error: 'File too large (max 2 MB)' };

  const ext = ALLOWED_MIME_TYPES[file.type];
  if (!ext) return { url: null, error: 'Invalid file type' };

  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  if (!isValidImageBytes(bytes, file.type)) return { url: null, error: 'Invalid file type' };

  const fileName = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(fileName, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) return { url: null };

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
  return { url: data.publicUrl };
}

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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // SEC-08: reject cross-origin requests
  if (!checkOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const formData = await req.formData();
  const name = formData.get('name');
  const description = formData.get('description');
  const price = formData.get('price');
  const meal_date = formData.get('meal_date');
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
      image_url,
      category,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // SEC-15: audit log
  await logAdminAction('menu.create', req, data.id, { name: name.trim(), category });

  return NextResponse.json(data, { status: 201 });
}
