import Image from 'next/image';
import { createAdminClient } from '@/lib/supabase/server';
import FundraisingTracker from '@/components/public/FundraisingTracker';
import ReservationForm from '@/components/public/ReservationForm';
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

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-teal-800 text-white py-5 px-4 shadow-md">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
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
              Marmita Solidária
            </h1>
            <p className="text-teal-200 text-sm mt-0.5">
              Primeira Igreja Baptista de Vila Real
            </p>
            <p className="text-teal-300 text-xs mt-0.5">
              Cada refeição é uma bênção para as obras do nosso templo
            </p>
          </div>
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
            <p className="text-[#1a3a3a]/60 text-lg">
              Não há refeições disponíveis esta semana.
            </p>
            <p className="text-[#1a3a3a]/40 text-sm mt-2">Volte em breve!</p>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-teal-900 text-teal-200 py-4 px-4 text-center text-sm">
        <p>Pagamentos via MBWay para <strong className="text-white tracking-widest">{mbwayPhone}</strong></p>
        <p className="mt-1">
          <a href="/admin/login" className="text-teal-400 hover:text-white underline text-xs transition-colors">
            Área de gestão
          </a>
        </p>
      </footer>
    </div>
  );
}
