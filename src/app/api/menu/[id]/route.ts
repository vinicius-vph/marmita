import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAdminSession } from '@/lib/auth';

const BUCKET = 'menu-images';
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

async function uploadImage(supabase: ReturnType<typeof createAdminClient>, file: File): Promise<string | null> {
  if (file.size > MAX_SIZE) return null;
  const ext = file.name.split('.').pop() ?? 'jpg';
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(fileName, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) return null;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
}

function fileNameFromUrl(url: string): string | null {
  try {
    return new URL(url).pathname.split('/').pop() ?? null;
  } catch {
    return null;
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await params;
  const formData = await req.formData();
  const name = formData.get('name') as string;
  const description = (formData.get('description') as string) || null;
  const price = formData.get('price') as string;
  const meal_date = formData.get('meal_date') as string;
  const imageFile = formData.get('image') as File | null;
  const existingImageUrl = (formData.get('existing_image_url') as string) || null;

  const supabase = createAdminClient();

  let image_url: string | null = existingImageUrl;

  if (imageFile && imageFile.size > 0) {
    if (imageFile.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Imagem demasiado grande (máx. 2 MB)' }, { status: 400 });
    }
    // Delete old image from storage if it exists
    if (existingImageUrl) {
      const oldFileName = fileNameFromUrl(existingImageUrl);
      if (oldFileName) {
        await supabase.storage.from(BUCKET).remove([oldFileName]);
      }
    }
    image_url = await uploadImage(supabase, imageFile);
  }

  const category = (formData.get('category') as string) || 'meals';

  const { data, error } = await supabase
    .from('menu_items')
    .update({ name, description, price: parseFloat(price), meal_date, image_url, category })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await params;
  const supabase = createAdminClient();

  // Fetch item to get image_url before soft-deleting
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
  return NextResponse.json({ success: true });
}
