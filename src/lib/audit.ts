import { createAdminClient } from '@/lib/supabase/server';

// SEC-15: fire-and-forget audit log for admin actions.
// Failures are swallowed so they never interrupt the main response.
export async function logAdminAction(
  action: string,
  req: Request,
  entityId?: string,
  payload?: Record<string, unknown>
): Promise<void> {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      req.headers.get('x-real-ip') ??
      null;

    const supabase = createAdminClient();
    await supabase.from('admin_audit_log').insert({
      action,
      entity_id: entityId ?? null,
      payload: payload ?? null,
      ip_address: ip,
    });
  } catch {
    // Audit failures must never break the main flow
  }
}
