import { createAdminClient } from '@/lib/supabase/server';
import { anonymizeIp } from '@/lib/ip';

// Audit entries are kept for abuse investigation, not accounting — financial totals live on
// `reservations`, untouched by this. Purged on a rolling basis to limit how long the (already
// network-truncated) IP stays around.
const RETENTION_DAYS = 180;

export async function logAdminAction(
  action: string,
  req: Request,
  entityId?: string,
  payload?: Record<string, unknown>
): Promise<void> {
  try {
    const rawIp = req.headers.get('x-real-ip')?.trim();
    const ip = rawIp ? anonymizeIp(rawIp) : null;

    const supabase = createAdminClient();
    await supabase.from('admin_audit_log').insert({
      action,
      entity_id: entityId ?? null,
      payload: payload ?? null,
      ip_address: ip,
    });

    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
    supabase.from('admin_audit_log').delete().lt('created_at', cutoff).then(() => {});
  } catch (e) {
    console.error('Audit log failed:', e);
  }
}
