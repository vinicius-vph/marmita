import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import type { Category } from '@/types';

const VALID_CATEGORIES: Category[] = ['meals', 'breakfast'];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get('category');
  const category: Category = VALID_CATEGORIES.includes(raw as Category) ? (raw as Category) : 'meals';

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('fundraising_summary')
    .select('*')
    .eq('category', category)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
