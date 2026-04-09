import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';
import { getAdminSession } from '@/lib/auth';

export async function PUT(req: NextRequest) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { goal, label, manual_raised } = await req.json();
  if (!goal || isNaN(parseFloat(goal))) {
    return NextResponse.json({ error: 'Objetivo inválido' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const update: Record<string, unknown> = {
    goal: parseFloat(goal),
    updated_at: new Date().toISOString(),
  };
  if (label) update.label = label;
  if (manual_raised !== undefined && !isNaN(parseFloat(manual_raised))) {
    update.manual_raised = parseFloat(manual_raised);
  }

  const { data, error } = await supabase
    .from('fundraising_config')
    .update(update)
    .eq('id', 1)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath('/');
  return NextResponse.json(data);
}
