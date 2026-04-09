import { createAdminClient } from '@/lib/supabase/server';
import ReservationsTable from '@/components/admin/ReservationsTable';
import type { Reservation } from '@/types';

export const revalidate = 0;

export default async function AdminDashboard() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('reservations')
    .select('*, menu_items(name, meal_date, price)')
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 rounded-xl p-4">
        Erro ao carregar reservas: {error.message}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-stone-800 mb-6">Reservas</h2>
      <ReservationsTable reservations={(data ?? []) as Reservation[]} />
    </div>
  );
}
