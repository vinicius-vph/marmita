import { getTranslations } from 'next-intl/server';
import { createAdminClient } from '@/lib/supabase/server';
import ReservationsTable from '@/components/admin/ReservationsTable';
import type { ReservationWithMenu, Category } from '@/types';

export const revalidate = 0;

interface Props {
  searchParams: Promise<{ category?: string }>;
}

export default async function AdminDashboard({ searchParams }: Props) {
  const params = await searchParams;
  const category: Category = params.category === 'breakfast' ? 'breakfast' : 'meals';
  const supabase = createAdminClient();
  const t = await getTranslations('AdminDashboard');

  const { data: menuItemsData } = await supabase
    .from('menu_items')
    .select('id')
    .eq('category', category)
    .order('meal_date', { ascending: false });

  const menuItemIds = (menuItemsData ?? []).map((m) => m.id);

  let data: ReservationWithMenu[] = [];
  let error: { message: string } | null = null;

  if (menuItemIds.length > 0) {
    const result = await supabase
      .from('reservations')
      .select('*, menu_items(name, meal_date, price, category)')
      .in('menu_item_id', menuItemIds)
      .order('created_at', { ascending: false });
    data = (result.data ?? []) as ReservationWithMenu[];
    error = result.error;
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 rounded-xl p-4">
        {t('error', { message: error.message })}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-stone-800 mb-6">{t('title')}</h2>
      <ReservationsTable
        key={category}
        reservations={(data ?? []) as ReservationWithMenu[]}
        category={category}
      />
    </div>
  );
}
