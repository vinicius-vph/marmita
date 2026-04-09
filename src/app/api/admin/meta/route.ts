import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAdminSession } from '@/lib/auth';

export async function PUT(req: NextRequest) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { goal, label } = await req.json();
  if (!goal || isNaN(parseFloat(goal))) {
    return NextResponse.json({ error: 'Objetivo inválido' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const update: Record<string, unknown> = {
    goal: parseFloat(goal),
    updated_at: new Date().toISOString(),
  };
  if (label) update.label = label;

  const { data, error } = await supabase
    .from('fundraising_config')
    .update(update)
    .eq('id', 1)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
