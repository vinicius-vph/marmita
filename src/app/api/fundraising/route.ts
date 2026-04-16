import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { VALID_CATEGORIES } from '@/lib/constants';
import type { Category } from '@/types';

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

  if (error) return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  return NextResponse.json(data);
}
