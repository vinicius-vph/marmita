import { getTranslations } from 'next-intl/server';
import { createAdminClient } from '@/lib/supabase/server';
import MenuManager from '@/components/admin/MenuManager';
import type { MenuItem, Category } from '@/types';

export const revalidate = 0;

interface Props {
  searchParams: Promise<{ category?: string }>;
}

export default async function AdminMenuPage({ searchParams }: Props) {
  const params = await searchParams;
  const category: Category = params.category === 'breakfast' ? 'breakfast' : 'meals';
  const supabase = createAdminClient();
  const t = await getTranslations('AdminMenu');

  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('active', true)
    .eq('category', category)
    .order('meal_date', { ascending: false });

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
      <MenuManager key={category} items={(data ?? []) as MenuItem[]} category={category} />
    </div>
  );
}
