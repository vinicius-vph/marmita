import { getTranslations } from 'next-intl/server';
import { createAdminClient } from '@/lib/supabase/server';
import GoalForm from '@/components/admin/GoalForm';
import type { FundraisingSummary } from '@/types';

export const revalidate = 0;

export default async function AdminMetaPage() {
  const supabase = createAdminClient();
  const t = await getTranslations('AdminMeta');

  const { data, error } = await supabase
    .from('fundraising_summary')
    .select('*')
    .single();

  const fundraising: FundraisingSummary = data ?? {
    goal: 5000,
    label: 'Obras do Templo',
    raised: 0,
    remaining: 5000,
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
