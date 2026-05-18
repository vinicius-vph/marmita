export const revalidate = 0;

import { createAdminClient } from '@/lib/supabase/server';
import { getMonthlyHistory } from '@/lib/fundraising-history';
import { isFeatureEnabled } from '@/lib/features';
import CategoryTabs from '@/components/public/CategoryTabs';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import type { MenuItem, FundraisingSummary, MonthlyFundraising } from '@/types';

const MEALS_FUND_FALLBACK: FundraisingSummary = {
  category: 'meals',
  goal: 5000,
  label: 'Obras do Templo',
  raised: 0,
  remaining: 5000,
};

const BREAKFAST_FUND_FALLBACK: FundraisingSummary = {
  category: 'breakfast',
  goal: 1000,
  label: 'Café da Manhã Solidário',
  raised: 0,
  remaining: 1000,
};

async function getData() {
  const supabase = createAdminClient();
  const breakfastEnabled = isFeatureEnabled('breakfast');

  const [mealsRes, mealsFundRes, mealsHistory] = await Promise.all([
    supabase.from('menu_items').select('*').eq('active', true).eq('category', 'meals').order('meal_date', { ascending: true }),
    supabase.from('fundraising_summary').select('*').eq('category', 'meals').single(),
    getMonthlyHistory('meals'),
  ]);

  const meals = (mealsRes.data ?? []) as MenuItem[];
  const mealsFundraising = (mealsFundRes.data ?? MEALS_FUND_FALLBACK) as FundraisingSummary;

  if (!breakfastEnabled) {
    return {
      meals,
      breakfast: null,
      mealsFundraising,
      breakfastFundraising: null,
      mealsHistory,
      breakfastHistory: null,
    };
  }

  const [breakfastRes, breakfastFundRes, breakfastHistory] = await Promise.all([
    supabase.from('menu_items').select('*').eq('active', true).eq('category', 'breakfast').order('meal_date', { ascending: true }),
    supabase.from('fundraising_summary').select('*').eq('category', 'breakfast').single(),
    getMonthlyHistory('breakfast'),
  ]);

  return {
    meals,
    breakfast: (breakfastRes.data ?? []) as MenuItem[],
    mealsFundraising,
    breakfastFundraising: (breakfastFundRes.data ?? BREAKFAST_FUND_FALLBACK) as FundraisingSummary,
    mealsHistory,
    breakfastHistory,
  };
}

export default async function HomePage() {
  const data = await getData();

  return (
    <div className="min-h-screen flex flex-col">
      <Header showTagline showLanguageSwitcher />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <CategoryTabs
          meals={data.meals}
          breakfast={data.breakfast}
          mealsFundraising={data.mealsFundraising}
          breakfastFundraising={data.breakfastFundraising}
          mealsHistory={data.mealsHistory}
          breakfastHistory={data.breakfastHistory}
        />
      </main>

      <Footer showAdminLink />
    </div>
  );
}
