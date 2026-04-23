import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAdminSession, checkOrigin } from '@/lib/auth';
import { logAdminAction } from '@/lib/audit';
import { UUID_REGEX } from '@/lib/constants';

export async function PATCH(
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
    return NextResponse.json({ error: 'Invalid reservation ID' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from('reservations')
    .select('cancelled')
    .eq('id', id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
  }
  if (existing.cancelled) {
    return NextResponse.json({ error: 'Reservation already cancelled' }, { status: 409 });
  }

  const { data, error } = await supabase
    .from('reservations')
    .update({ cancelled: true })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Internal server error' }, { status: 500 });

  await logAdminAction('reservation.cancel', req, id);

  return NextResponse.json(data);
}
