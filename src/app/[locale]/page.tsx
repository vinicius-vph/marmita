export const revalidate = 0;

import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { createAdminClient } from '@/lib/supabase/server';
import CategoryTabs from '@/components/public/CategoryTabs';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { formatPhone } from '@/lib/utils';
import { env } from '@/env';
import type { MenuItem, FundraisingSummary } from '@/types';

async function getData() {
  const supabase = createAdminClient();

  const [mealsRes, breakfastRes, mealsFundRes, breakfastFundRes] = await Promise.all([
    supabase.from('menu_items').select('*').eq('active', true).eq('category', 'meals').order('meal_date', { ascending: true }),
    supabase.from('menu_items').select('*').eq('active', true).eq('category', 'breakfast').order('meal_date', { ascending: true }),
    supabase.from('fundraising_summary').select('*').eq('category', 'meals').single(),
    supabase.from('fundraising_summary').select('*').eq('category', 'breakfast').single(),
  ]);

  return {
    meals: (mealsRes.data ?? []) as MenuItem[],
    breakfast: (breakfastRes.data ?? []) as MenuItem[],
    mealsFundraising: (mealsFundRes.data ?? {
      category: 'meals' as const,
      goal: 5000,
      label: 'Obras do Templo',
      raised: 0,
      remaining: 5000,
    }) as FundraisingSummary,
    breakfastFundraising: (breakfastFundRes.data ?? {
      category: 'breakfast' as const,
      goal: 1000,
      label: 'Café da Manhã Solidário',
      raised: 0,
      remaining: 1000,
    }) as FundraisingSummary,
  };
}

export default async function HomePage() {
  const { meals, breakfast, mealsFundraising, breakfastFundraising } = await getData();
  const mbwayPhone = formatPhone(env.MBWAY_PHONE);
  const t = await getTranslations('Home');

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-teal-800 text-white py-5 px-4 shadow-md">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="shrink-0">
              <Image
                src="/logo.jpg"
                alt="Primeira Igreja Baptista de Vila Real"
                width={64}
                height={64}
                className="rounded-full border-2 border-teal-300 shadow"
                priority
              />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight leading-tight">
                {t('title')}
              </h1>
              <p className="text-teal-200 text-sm mt-0.5">{t('subtitle')}</p>
              <p className="text-teal-300 text-xs mt-0.5">{t('tagline')}</p>
            </div>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <CategoryTabs
          meals={meals}
          breakfast={breakfast}
          mealsFundraising={mealsFundraising}
          breakfastFundraising={breakfastFundraising}
        />
      </main>

      {/* Footer */}
      <footer className="bg-teal-900 text-teal-200 py-4 px-4 text-center text-sm">
        <p>{t('payment')} <strong className="text-white tracking-widest">{mbwayPhone}</strong></p>
        <p className="mt-1">
          <a href="/admin/login" className="text-teal-400 hover:text-white underline text-xs transition-colors">
            {t('adminLink')}
          </a>
        </p>
      </footer>
    </div>
  );
}
