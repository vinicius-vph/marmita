import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAdminSession, checkOrigin } from '@/lib/auth';
import { logAdminAction } from '@/lib/audit';
import type { Category } from '@/types';

const BUCKET = 'menu-images';
const MAX_SIZE = 2 * 1024 * 1024;
const VALID_CATEGORIES: Category[] = ['meals', 'breakfast'];
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

function fileNameFromUrl(url: string): string | null {
  try {
    const fileName = new URL(url).pathname.split('/').pop() ?? null;
    if (!fileName) return null;
    const nameWithoutExt = fileName.split('.')[0];
    if (!UUID_REGEX.test(nameWithoutExt)) return null;
    return fileName;
  } catch {
    return null;
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // SEC-08: reject cross-origin requests
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
      const oldFileName = fileNameFromUrl(existingImageUrl);
      if (oldFileName) {
        await supabase.storage.from(BUCKET).remove([oldFileName]);
      }
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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // SEC-15: audit log
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

  // SEC-08: reject cross-origin requests
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
    const fileName = fileNameFromUrl(item.image_url);
    if (fileName) {
      await supabase.storage.from(BUCKET).remove([fileName]);
    }
  }

  const { error } = await supabase
    .from('menu_items')
    .update({ active: false })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // SEC-15: audit log
  await logAdminAction('menu.delete', req, id);

  return NextResponse.json({ success: true });
}
