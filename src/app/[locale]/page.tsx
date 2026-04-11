export const revalidate = 0;

import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { createAdminClient } from '@/lib/supabase/server';
import FundraisingTracker from '@/components/public/FundraisingTracker';
import ReservationForm from '@/components/public/ReservationForm';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { formatPhone } from '@/lib/utils';
import type { MenuItem, FundraisingSummary } from '@/types';

async function getData() {
  const supabase = createAdminClient();

  const [menuRes, fundraisingRes] = await Promise.all([
    supabase
      .from('menu_items')
      .select('*')
      .eq('active', true)
      .order('meal_date', { ascending: true }),
    supabase.from('fundraising_summary').select('*').single(),
  ]);

  return {
    menuItems: (menuRes.data ?? []) as MenuItem[],
    fundraising: (fundraisingRes.data ?? {
      goal: 5000,
      label: 'Obras do Templo',
      raised: 0,
      remaining: 5000,
    }) as FundraisingSummary,
  };
}

export default async function HomePage() {
  const { menuItems, fundraising } = await getData();
  const mbwayPhone = formatPhone(process.env.MBWAY_PHONE ?? '+351968326760');
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
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 space-y-10">
        {/* Fundraising progress */}
        <FundraisingTracker data={fundraising} />

        {/* Menu + Reservation */}
        {menuItems.length > 0 ? (
          <ReservationForm menuItems={menuItems} />
        ) : (
          <section className="text-center py-12">
            <p className="text-[#1a3a3a]/60 text-lg">{t('noMeals')}</p>
            <p className="text-[#1a3a3a]/40 text-sm mt-2">{t('comeBackSoon')}</p>
          </section>
        )}
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
