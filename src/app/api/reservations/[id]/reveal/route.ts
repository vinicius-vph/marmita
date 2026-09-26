import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAdminSession, checkOrigin } from '@/lib/auth';
import { logAdminAction } from '@/lib/audit';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { UUID_REGEX } from '@/lib/constants';

const REVEAL_MAX_PER_WINDOW = 60;

export async function POST(
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

  const rateLimit = await checkRateLimit(`reveal:${getClientIp(req)}`, REVEAL_MAX_PER_WINDOW);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } }
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('reservations')
    .select('customer_name, customer_phone')
    .eq('id', id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await logAdminAction('reservation.reveal', req, id);

  return NextResponse.json(
    { name: data.customer_name, phone: data.customer_phone },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
