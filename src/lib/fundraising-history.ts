import { createAdminClient } from '@/lib/supabase/server';
import type { Category, MonthlyFundraising } from '@/types';

export async function getMonthlyHistory(
  category: Category,
  year?: number,
): Promise<MonthlyFundraising[]> {
  const supabase = createAdminClient();
  const targetYear = year ?? new Date().getFullYear();

  const start = new Date(targetYear, 0, 1);
  const end = new Date(targetYear, 11, 31, 23, 59, 59, 999);

  const { data: items } = await supabase
    .from('menu_items')
    .select('id')
    .eq('category', category);

  const itemIds = (items ?? []).map((i: { id: string }) => i.id);

  const byMonth: Record<string, number> = {};

  if (itemIds.length > 0) {
    const { data: reservations } = await supabase
      .from('reservations')
      .select('paid_at, total_amount')
      .eq('paid', true)
      .in('menu_item_id', itemIds)
      .gte('paid_at', start.toISOString())
      .lte('paid_at', end.toISOString())
      .not('paid_at', 'is', null);

    for (const r of reservations ?? []) {
      const month = (r.paid_at as string).slice(0, 7);
      byMonth[month] = (byMonth[month] ?? 0) + Number(r.total_amount);
    }
  }

  const result: MonthlyFundraising[] = [];
  for (let m = 0; m < 12; m++) {
    const month = `${targetYear}-${String(m + 1).padStart(2, '0')}`;
    result.push({ month, total: byMonth[month] ?? 0 });
  }

  return result;
}
