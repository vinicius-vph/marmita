export const revalidate = 0;

import { createAdminClient } from '@/lib/supabase/server';
import { getMonthlyHistory } from '@/lib/fundraising-history';
import CategoryTabs from '@/components/public/CategoryTabs';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import type { MenuItem, FundraisingSummary } from '@/types';

async function getData() {
  const supabase = createAdminClient();

  const [mealsRes, breakfastRes, mealsFundRes, breakfastFundRes, mealsHistory, breakfastHistory] =
    await Promise.all([
      supabase.from('menu_items').select('*').eq('active', true).eq('category', 'meals').order('meal_date', { ascending: true }),
      supabase.from('menu_items').select('*').eq('active', true).eq('category', 'breakfast').order('meal_date', { ascending: true }),
      supabase.from('fundraising_summary').select('*').eq('category', 'meals').single(),
      supabase.from('fundraising_summary').select('*').eq('category', 'breakfast').single(),
      getMonthlyHistory('meals'),
      getMonthlyHistory('breakfast'),
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
    mealsHistory,
    breakfastHistory,
  };
}

export default async function HomePage() {
  const { meals, breakfast, mealsFundraising, breakfastFundraising, mealsHistory, breakfastHistory } =
    await getData();

  return (
    <div className="min-h-screen flex flex-col">
      <Header showTagline showLanguageSwitcher />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <CategoryTabs
          meals={meals}
          breakfast={breakfast}
          mealsFundraising={mealsFundraising}
          breakfastFundraising={breakfastFundraising}
          mealsHistory={mealsHistory}
          breakfastHistory={breakfastHistory}
        />
      </main>

      <Footer showAdminLink />
    </div>
  );
}
