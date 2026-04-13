'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Reservation } from '@/types';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';

type Filter = 'all' | 'pending' | 'paid';

export default function ReservationsTable({ reservations: initial }: { reservations: Reservation[] }) {
  const router = useRouter();
  const t = useTranslations('ReservationsTable');
  const [reservations, setReservations] = useState(initial);
  const [filter, setFilter] = useState<Filter>('all');
  const [confirming, setConfirming] = useState<string | null>(null);

  const filtered = reservations.filter((r) => {
    if (filter === 'pending') return !r.paid;
    if (filter === 'paid') return r.paid;
    return true;
  });

  const totalPaid = reservations.filter((r) => r.paid).reduce((sum, r) => sum + r.total_amount, 0);
  const totalPending = reservations.filter((r) => !r.paid).reduce((sum, r) => sum + r.total_amount, 0);

  async function confirmPayment(id: string) {
    setConfirming(id);
    const res = await fetch(`/api/reservations/${id}/confirm`, { method: 'PATCH' });
    if (res.ok) {
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, paid: true, paid_at: new Date().toISOString() } : r))
      );
      router.refresh();
    }
    setConfirming(null);
  }

  const filterLabels: Record<Filter, string> = {
    all: t('filterAll'),
    pending: t('filterPending'),
    paid: t('filterPaid'),
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-xs text-green-600 uppercase tracking-wide">{t('received')}</p>
          <p className="text-xl font-bold text-green-700">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
          <p className="text-xs text-teal-600 uppercase tracking-wide">{t('pending')}</p>
          <p className="text-xl font-bold text-teal-700">{formatCurrency(totalPending)}</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'paid'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-teal-800 text-white'
                : 'bg-white border border-stone-300 text-[#1a3a3a]/70 hover:bg-stone-50'
            }`}
          >
            {filterLabels[f]}{' '}
            <span className="opacity-70">
              ({reservations.filter((r) =>
                f === 'all' ? true : f === 'pending' ? !r.paid : r.paid
              ).length})
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-[#1a3a3a]/40 py-8">{t('empty')}</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div
              key={r.id}
              className={`bg-white rounded-xl border p-4 shadow-sm ${
                r.paid ? 'border-green-200' : 'border-stone-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="font-semibold text-[#1a3a3a]">{r.customer_name}</p>
                  <p className="text-sm text-[#1a3a3a]/60">{r.customer_phone}</p>
                  {r.menu_items && (
                    <p className="text-sm text-[#1a3a3a]/70 mt-1">
                      {r.quantity}x {r.menu_items.name}{' '}
                      <span className="text-[#1a3a3a]/40">
                        — {formatDate(r.menu_items.meal_date)}
                      </span>
                    </p>
                  )}
                  <p className="text-xs text-[#1a3a3a]/40 mt-1">
                    {t('reservedAt', { date: formatDateTime(r.created_at) })}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-teal-700">{formatCurrency(r.total_amount)}</p>
                  {r.paid ? (
                    <span className="inline-block mt-1 text-xs bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full">
                      {t('paid')}
                    </span>
                  ) : (
                    <button
                      onClick={() => confirmPayment(r.id)}
                      disabled={confirming === r.id}
                      className="mt-1 text-xs bg-teal-700 hover:bg-teal-800 disabled:bg-teal-300 text-white font-medium px-3 py-1 rounded-full transition-colors"
                    >
                      {confirming === r.id ? t('confirming') : t('confirmPayment')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
