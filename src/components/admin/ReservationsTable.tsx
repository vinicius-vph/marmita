'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { ReservationWithMenu } from '@/types';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';

type StatusFilter = 'all' | 'pending' | 'paid';

export default function ReservationsTable({ reservations: initial }: { reservations: ReservationWithMenu[] }) {
  const router = useRouter();
  const t = useTranslations('ReservationsTable');
  const locale = useLocale();
  const [reservations, setReservations] = useState(initial);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [filterDish, setFilterDish] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [filterMealDate, setFilterMealDate] = useState('');
  const [confirming, setConfirming] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null);

  const uniqueDishes = useMemo(() => {
    const seen = new Set<string>();
    return reservations
      .map((r) => r.menu_items?.name)
      .filter((name): name is string => !!name && !seen.has(name) && !!seen.add(name));
  }, [reservations]);

  const uniqueDates = useMemo(() => {
    const seen = new Set<string>();
    return reservations
      .map((r) => r.menu_items?.meal_date)
      .filter((d): d is string => !!d && !seen.has(d) && !!seen.add(d))
      .sort();
  }, [reservations]);

  const filtered = reservations.filter((r) => {
    if (statusFilter === 'pending' && (r.paid || r.cancelled)) return false;
    if (statusFilter === 'paid' && !r.paid) return false;
    if (filterDish && r.menu_items?.name !== filterDish) return false;
    if (filterPayment && r.payment_method !== filterPayment) return false;
    if (filterMealDate && r.menu_items?.meal_date !== filterMealDate) return false;
    return true;
  });

  const activeReservations = reservations.filter((r) => !r.cancelled);
  const totalPaid = activeReservations.filter((r) => r.paid).reduce((sum, r) => sum + r.total_amount, 0);
  const totalPending = activeReservations.filter((r) => !r.paid).reduce((sum, r) => sum + r.total_amount, 0);

  const statusCounts: Record<StatusFilter, number> = {
    all: reservations.length,
    pending: reservations.filter((r) => !r.paid && !r.cancelled).length,
    paid: reservations.filter((r) => r.paid).length,
  };

  async function confirmPayment(id: string) {
    setConfirming(id);
    const res = await fetch(`/api/reservations/${id}/confirm`, {
      method: 'PATCH',
      headers: { Origin: window.location.origin },
    });
    if (res.ok) {
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, paid: true, paid_at: new Date().toISOString() } : r))
      );
      router.refresh();
    }
    setConfirming(null);
  }

  async function cancelReservation(id: string) {
    setCancelling(id);
    const res = await fetch(`/api/reservations/${id}/cancel`, {
      method: 'PATCH',
      headers: { Origin: window.location.origin },
    });
    if (res.ok) {
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, cancelled: true } : r))
      );
      router.refresh();
    }
    setCancelling(null);
    setCancelConfirm(null);
  }

  const paymentLabel: Record<string, string> = {
    mbway: t('paymentMbway'),
    cash: t('paymentCash'),
    transfer: t('paymentTransfer'),
  };

  const selectClass = 'border border-stone-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-400';

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
        {(['all', 'pending', 'paid'] as StatusFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === f
                ? 'bg-teal-800 text-white'
                : 'bg-white border border-stone-300 text-foreground/70 hover:bg-stone-50'
            }`}
          >
            {f === 'all' ? t('filterAll') : f === 'pending' ? t('filterPending') : t('filterPaid')}{' '}
            <span className="opacity-70">({statusCounts[f]})</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-foreground/50 font-medium">{t('filterDish')}</label>
          <select value={filterDish} onChange={(e) => setFilterDish(e.target.value)} className={selectClass}>
            <option value="">{t('allDishes')}</option>
            {uniqueDishes.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-foreground/50 font-medium">{t('filterPayment')}</label>
          <select value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)} className={selectClass}>
            <option value="">{t('allPayments')}</option>
            <option value="mbway">{t('paymentMbway')}</option>
            <option value="cash">{t('paymentCash')}</option>
            <option value="transfer">{t('paymentTransfer')}</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-foreground/50 font-medium">{t('filterMealDate')}</label>
          <select value={filterMealDate} onChange={(e) => setFilterMealDate(e.target.value)} className={selectClass}>
            <option value="">{t('allDates')}</option>
            {uniqueDates.map((d) => (
              <option key={d} value={d}>{formatDate(d, locale)}</option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-foreground/40 py-8">{t('empty')}</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div
              key={r.id}
              className={`bg-white rounded-xl border p-4 shadow-sm ${
                r.cancelled ? 'border-stone-200 opacity-60' : r.paid ? 'border-green-200' : 'border-stone-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{r.customer_name}</p>
                  <p className="text-sm text-foreground/60">{r.customer_phone}</p>
                  {r.menu_items && (
                    <p className="text-sm text-foreground/70 mt-1">
                      {r.quantity}x {r.menu_items.name}{' '}
                      <span className="text-foreground/40">
                        — {formatDate(r.menu_items.meal_date, locale)}
                      </span>
                    </p>
                  )}
                  <p className="text-xs text-foreground/40 mt-1">
                    {t('reservedAt', { date: formatDateTime(r.created_at, locale) })}
                    {' · '}
                    <span className="text-foreground/50">{paymentLabel[r.payment_method] ?? r.payment_method}</span>
                  </p>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <p className="font-bold text-teal-700">{formatCurrency(r.total_amount)}</p>

                  {r.cancelled ? (
                    <span className="inline-block text-xs bg-stone-100 text-stone-500 font-medium px-2 py-0.5 rounded-full">
                      {t('cancelledBadge')}
                    </span>
                  ) : r.paid ? (
                    <span className="inline-block text-xs bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full">
                      {t('paid')}
                    </span>
                  ) : (
                    <button
                      onClick={() => confirmPayment(r.id)}
                      disabled={confirming === r.id}
                      className="text-xs bg-teal-700 hover:bg-teal-800 disabled:bg-teal-300 text-white font-medium px-3 py-1 rounded-full transition-colors"
                    >
                      {confirming === r.id ? t('confirming') : t('confirmPayment')}
                    </button>
                  )}

                  {!r.cancelled && (
                    cancelConfirm === r.id ? (
                      <div className="flex items-center gap-1 justify-end mt-1">
                        <span className="text-xs text-foreground/60">{t('cancelConfirmText')}</span>
                        <button
                          onClick={() => cancelReservation(r.id)}
                          disabled={cancelling === r.id}
                          className="text-xs bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-medium px-2 py-0.5 rounded-full transition-colors"
                        >
                          {cancelling === r.id ? t('cancelling') : t('cancelYes')}
                        </button>
                        <button
                          onClick={() => setCancelConfirm(null)}
                          className="text-xs bg-white border border-stone-300 text-foreground/70 hover:bg-stone-50 font-medium px-2 py-0.5 rounded-full transition-colors"
                        >
                          {t('cancelNo')}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setCancelConfirm(r.id)}
                        className="block text-xs text-red-500 hover:text-red-700 font-medium mt-1 ml-auto transition-colors"
                      >
                        {t('cancelBtn')}
                      </button>
                    )
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
