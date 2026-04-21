export const revalidate = 0;

import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { formatCurrency } from '@/lib/utils';
import { formatPhone } from '@/lib/utils';
import { createAdminClient } from '@/lib/supabase/server';
import { UUID_REGEX } from '@/lib/constants';
import MbwayPaymentGuide from '@/components/public/MbwayPaymentGuide';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { env } from '@/env';

interface Props {
  searchParams: Promise<{ id?: string }>;
}

export default async function ObrigadoPage({ searchParams }: Props) {
  const { id } = await searchParams;

  if (!id || !UUID_REGEX.test(id)) redirect('/');

  const supabase = createAdminClient();
  const { data: reservation } = await supabase
    .from('reservations')
    .select('customer_name, quantity, total_amount, menu_items(name, category)')
    .eq('id', id)
    .single();

  if (!reservation) redirect('/');

  const menuItem = reservation.menu_items as unknown as { name: string; category: string } | null;
  const nome = reservation.customer_name;
  const prato = menuItem?.name ?? '';
  const quantidade = reservation.quantity;
  const total = reservation.total_amount;
  const isBreakfast = menuItem?.category === 'breakfast';

  const mbwayPhone = formatPhone(env.MBWAY_PHONE);
  const t = await getTranslations('ThankYou');
  const reference = isBreakfast
    ? t('step5refBreakfast', { dish: prato, name: nome })
    : t('step5ref', { dish: prato, name: nome });

  return (
    <div className="min-h-screen flex flex-col">
      <Header showLanguageSwitcher />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10">
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 md:p-8 space-y-6">
          <div className="text-center">
            <div className="text-5xl mb-3">{isBreakfast ? '☕' : '🙏'}</div>
            <h2 className="text-2xl font-bold text-teal-900">
              {t('title', { name: nome })}
            </h2>
            <p className="text-teal-900/60 mt-1">
              {isBreakfast ? t('subtitleBreakfast') : t('subtitle')}
            </p>
          </div>

          <div className="bg-stone-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-teal-900/60">{t('dish')}</span>
              <span className="font-medium text-teal-900">{prato}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-teal-900/60">{t('quantity')}</span>
              <span className="font-medium text-teal-900">{quantidade}x</span>
            </div>
            <div className="flex justify-between border-t border-stone-200 pt-2 mt-2">
              <span className="text-teal-900 font-semibold">{t('total')}</span>
              <span className="font-bold text-teal-700 text-base">{formatCurrency(total)}</span>
            </div>
          </div>

          <MbwayPaymentGuide
            phone={mbwayPhone}
            rawPhone={env.MBWAY_PHONE}
            amount={formatCurrency(total)}
            reference={reference}
          />

          <p className="text-center text-sm text-teal-900/50">{t('disclaimer')}</p>

          <div className="text-center">
            <Link
              href="/"
              className="inline-block bg-teal-700 hover:bg-teal-800 text-white font-bold px-6 py-3 rounded-xl transition-colors"
            >
              {t('back')}
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
