import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';
import { getAdminSession, checkOrigin } from '@/lib/auth';
import { logAdminAction } from '@/lib/audit';
import { VALID_CATEGORIES } from '@/lib/constants';
import type { Category } from '@/types';

const MAX_FINANCIAL_VALUE = 1_000_000;
const MAX_LABEL_LENGTH = 255;
const MAX_BODY = 2_000; // 2 KB is more than enough for this payload

export async function PUT(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!checkOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const text = await req.text();
  if (text.length > MAX_BODY) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { goal, label, manual_raised, category } = body;

  const goalNum = parseFloat(goal as string);
  if (!goal || isNaN(goalNum) || goalNum <= 0 || goalNum > MAX_FINANCIAL_VALUE) {
    return NextResponse.json({ error: 'Invalid goal' }, { status: 400 });
  }

  if (!VALID_CATEGORIES.includes(category as Category)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const update: Record<string, unknown> = {
    goal: goalNum,
    updated_at: new Date().toISOString(),
  };

  if (label !== undefined) {
    if (typeof label !== 'string' || label.trim().length === 0 || label.length > MAX_LABEL_LENGTH) {
      return NextResponse.json({ error: 'Invalid label' }, { status: 400 });
    }
    update.label = label.trim();
  }

  if (manual_raised !== undefined) {
    const raisedNum = parseFloat(manual_raised as string);
    if (isNaN(raisedNum) || raisedNum < 0 || raisedNum > MAX_FINANCIAL_VALUE) {
      return NextResponse.json({ error: 'Invalid manual raised value' }, { status: 400 });
    }
    update.manual_raised = raisedNum;
  }

  const { data, error } = await supabase
    .from('fundraising_config')
    .update(update)
    .eq('category', category)
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Internal server error' }, { status: 500 });

  await logAdminAction('fundraising.update', req, category as string, {
    goal: goalNum,
    ...(label !== undefined && { label }),
    ...(manual_raised !== undefined && { manual_raised }),
  });

  revalidatePath('/');
  return NextResponse.json(data);
}
