import { getTranslations } from 'next-intl/server';
import { createAdminClient } from '@/lib/supabase/server';
import GoalForm from '@/components/admin/GoalForm';
import type { FundraisingSummary, Category } from '@/types';

export const revalidate = 0;

interface Props {
  searchParams: Promise<{ category?: string }>;
}

export default async function AdminMetaPage({ searchParams }: Props) {
  const params = await searchParams;
  const category: Category = params.category === 'breakfast' ? 'breakfast' : 'meals';
  const supabase = createAdminClient();
  const t = await getTranslations('AdminMeta');

  const { data, error } = await supabase
    .from('fundraising_summary')
    .select('*')
    .eq('category', category)
    .single();

  const fundraising: FundraisingSummary = data ?? {
    category,
    goal: category === 'meals' ? 5000 : 1000,
    label: category === 'meals' ? 'Obras do Templo' : 'Café da Manhã Solidário',
    raised: 0,
    remaining: category === 'meals' ? 5000 : 1000,
  };

  if (error && error.code !== 'PGRST116') {
    return (
      <div className="bg-red-50 text-red-700 rounded-xl p-4">
        {t('error', { message: error.message })}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-stone-800 mb-6">{t('title')}</h2>
      <GoalForm data={fundraising} />
    </div>
  );
}
