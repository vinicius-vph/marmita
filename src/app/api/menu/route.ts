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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') ?? 'meals';

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
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const formData = await req.formData();
  const name = formData.get('name') as string;
  const description = (formData.get('description') as string) || null;
  const price = formData.get('price') as string;
  const meal_date = formData.get('meal_date') as string;
  const imageFile = formData.get('image') as File | null;

  if (!name || !price || !meal_date) {
    return NextResponse.json({ error: 'Campos obrigatórios em falta' }, { status: 400 });
  }

  const supabase = createAdminClient();

  let image_url: string | null = null;
  if (imageFile && imageFile.size > 0) {
    image_url = await uploadImage(supabase, imageFile);
    if (image_url === null && imageFile.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Imagem demasiado grande (máx. 2 MB)' }, { status: 400 });
    }
  }

  const category = (formData.get('category') as string) || 'meals';

  const { data, error } = await supabase
    .from('menu_items')
    .insert({ name, description, price: parseFloat(price), meal_date, image_url, category })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
