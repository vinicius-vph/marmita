import { createAdminClient } from '@/lib/supabase/server';

export async function logAdminAction(
  action: string,
  req: Request,
  entityId?: string,
  payload?: Record<string, unknown>
): Promise<void> {
  try {
    const ip = req.headers.get('x-real-ip')?.trim() ?? null;

    const supabase = createAdminClient();
    await supabase.from('admin_audit_log').insert({
      action,
      entity_id: entityId ?? null,
      payload: payload ?? null,
      ip_address: ip,
    });
  } catch {
  }
}
