'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import FundraisingTracker from './FundraisingTracker';
import ReservationForm from './ReservationForm';
import type { MenuItem, FundraisingSummary, MonthlyFundraising } from '@/types';

interface Props {
  meals: MenuItem[];
  breakfast: MenuItem[];
  mealsFundraising: FundraisingSummary;
  breakfastFundraising: FundraisingSummary;
  mealsHistory: MonthlyFundraising[];
  breakfastHistory: MonthlyFundraising[];
}

export default function CategoryTabs({
  meals,
  breakfast,
  mealsFundraising,
  breakfastFundraising,
  mealsHistory,
  breakfastHistory,
}: Props) {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('category') === 'breakfast' ? 'breakfast' : 'meals';
  const [tab, setTab] = useState<'meals' | 'breakfast'>(initialTab);
  const t = useTranslations('CategoryTabs');
  const tHome = useTranslations('Home');

  const items = tab === 'meals' ? meals : breakfast;
  const fundraising = tab === 'meals' ? mealsFundraising : breakfastFundraising;
  const history = tab === 'meals' ? mealsHistory : breakfastHistory;

  return (
    <div className="space-y-8">
      <div className="flex gap-1 p-1 bg-stone-100 rounded-xl">
        <button
          onClick={() => setTab('meals')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
            tab === 'meals'
              ? 'bg-white text-teal-800 shadow-sm font-bold'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          {t('meals')}
        </button>
        <button
          onClick={() => setTab('breakfast')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
            tab === 'breakfast'
              ? 'bg-white text-amber-800 shadow-sm font-bold'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          {t('breakfast')}
        </button>
      </div>

      <FundraisingTracker data={fundraising} history={history} />

      <div>
        {items.length > 0 ? (
          <ReservationForm key={tab} menuItems={items} category={tab} />
        ) : (
          <section className="text-center py-12">
            <p className="text-foreground/60 text-lg">
              {tab === 'meals' ? tHome('noMeals') : tHome('noBreakfast')}
            </p>
            <p className="text-foreground/40 text-sm mt-2">{tHome('comeBackSoon')}</p>
          </section>
        )}
      </div>
    </div>
  );
}
