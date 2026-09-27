import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAdminSession, checkOrigin } from '@/lib/auth';
import { logAdminAction } from '@/lib/audit';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { UUID_REGEX } from '@/lib/constants';
import { CONTACT_COLUMNS, readContact } from '@/lib/reservation-contact';

const EXPORT_MAX_PER_WINDOW = 20;
const EXPORT_MAX_IDS = 500;

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!checkOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const ids: unknown = body?.ids;
  if (
    !Array.isArray(ids) ||
    ids.length === 0 ||
    ids.length > EXPORT_MAX_IDS ||
    !ids.every((id) => typeof id === 'string' && UUID_REGEX.test(id))
  ) {
    return NextResponse.json({ error: 'Invalid reservation IDs' }, { status: 400 });
  }

  const rateLimit = await checkRateLimit(`export:${getClientIp(req)}`, EXPORT_MAX_PER_WINDOW);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } }
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('reservations')
    .select(`id, ${CONTACT_COLUMNS}`)
    .in('id', ids);

  if (error) return NextResponse.json({ error: 'Internal server error' }, { status: 500 });

  await logAdminAction('reservation.export', req, undefined, { count: data?.length ?? 0 });

  const contacts = (data ?? []).map((row) => ({ id: row.id, ...readContact(row) }));

  return NextResponse.json(contacts, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
