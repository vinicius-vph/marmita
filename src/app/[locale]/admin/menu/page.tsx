import { getTranslations } from 'next-intl/server';
import { createAdminClient } from '@/lib/supabase/server';
import MenuManager from '@/components/admin/MenuManager';
import type { MenuItem } from '@/types';

export const revalidate = 0;

export default async function AdminMenuPage() {
  const supabase = createAdminClient();
  const t = await getTranslations('AdminMenu');

  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('active', true)
    .order('meal_date', { ascending: true });

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
      <MenuManager items={(data ?? []) as MenuItem[]} />
    </div>
  );
}
