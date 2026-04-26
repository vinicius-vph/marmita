'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { format } from 'date-fns';
import { pt, enUS, es } from 'date-fns/locale';
import type { Locale } from 'date-fns';
import { Category, ReservationWithMenu } from '@/types';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';

type StatusFilter = 'all' | 'pending' | 'paid';

const localeMap: Record<string, Locale> = { pt, en: enUS, es };

interface Props {
  reservations: ReservationWithMenu[];
  category: Category;
}

export default function ReservationsTable({ reservations: initial, category }: Props) {
  const router = useRouter();
  const t = useTranslations('ReservationsTable');
  const tReport = useTranslations('ReservationsReport');
  const tCat = useTranslations('CategoryTabs');
  const locale = useLocale();
  const dfLocale = localeMap[locale] ?? pt;
  const [reservations, setReservations] = useState(initial);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [filterDish, setFilterDish] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [filterMealDate, setFilterMealDate] = useState('');
  const [confirming, setConfirming] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

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

  const statusLabel = (r: ReservationWithMenu) =>
    r.cancelled ? t('cancelledBadge') : r.paid ? tReport('statusPaid') : tReport('statusPending');

  async function handleDownloadPdf() {
    setGeneratingPdf(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const MARGIN = 15;
      const PAGE_W = 210;
      const PAGE_H = 297;
      const CONTENT_W = PAGE_W - MARGIN * 2;

      doc.setFillColor(19, 78, 74);
      doc.rect(0, 0, PAGE_W, 28, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(255, 255, 255);
      doc.text('Marmita Solidária', MARGIN, 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(tReport('reportTitle'), MARGIN, 21);

      const datePattern = locale === 'en' ? 'MMMM d, yyyy' : "d 'de' MMMM 'de' yyyy";
      const dateStr = format(new Date(), datePattern, { locale: dfLocale });
      doc.setFontSize(8);
      doc.text(`${tReport('generatedOn')} ${dateStr}`, PAGE_W - MARGIN, 21, { align: 'right' });
      doc.text(tCat(category), PAGE_W - MARGIN, 27, { align: 'right' });

      const filteredPaid = filtered.filter((r) => r.paid && !r.cancelled).reduce((s, r) => s + r.total_amount, 0);
      const filteredPending = filtered.filter((r) => !r.paid && !r.cancelled).reduce((s, r) => s + r.total_amount, 0);

      const statsData = [
        { lbl: tReport('summaryCount'), val: String(filtered.length) },
        { lbl: tReport('summaryReceived'), val: formatCurrency(filteredPaid) },
        { lbl: tReport('summaryPending'), val: formatCurrency(filteredPending) },
      ];

      statsData.forEach(({ lbl, val }, i) => {
        const x = MARGIN + i * 61;
        doc.setFillColor(240, 247, 247);
        doc.rect(x, 35, 58, 15, 'F');
        doc.setDrawColor(199, 221, 221);
        doc.setLineWidth(0.2);
        doc.rect(x, 35, 58, 15, 'D');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(90, 138, 138);
        doc.text(lbl.toUpperCase(), x + 4, 41);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(26, 58, 58);
        doc.text(val, x + 4, 47);
      });

      const statusFilterLabel =
        statusFilter === 'all' ? t('filterAll') : statusFilter === 'pending' ? t('filterPending') : t('filterPaid');
      const filterLines: Array<[string, string]> = [
        [tReport('filterStatus'), statusFilterLabel],
        [tReport('filterDish'), filterDish || tReport('filterAny')],
        [tReport('filterPayment'), filterPayment ? paymentLabel[filterPayment] ?? filterPayment : tReport('filterAny')],
        [tReport('filterMealDate'), filterMealDate ? formatDate(filterMealDate, locale) : tReport('filterAny')],
      ];

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(26, 58, 58);
      doc.text(tReport('filtersTitle').toUpperCase(), MARGIN, 58);

      filterLines.forEach(([lbl, val], i) => {
        const x = MARGIN + (i % 2) * (CONTENT_W / 2);
        const y = 64 + Math.floor(i / 2) * 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(90, 138, 138);
        doc.text(`${lbl}:`, x, y);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(26, 58, 58);
        doc.text(val, x + 28, y);
      });

      let cursorY = 80;
      const ROW_H = 7;
      const COL_X = [
        MARGIN,
        MARGIN + 50,
        MARGIN + 80,
        MARGIN + 108,
        MARGIN + 128,
        MARGIN + 142,
        MARGIN + 162,
      ];
      const colWidths = [
        COL_X[1] - COL_X[0],
        COL_X[2] - COL_X[1],
        COL_X[3] - COL_X[2],
        COL_X[4] - COL_X[3],
        COL_X[5] - COL_X[4],
        COL_X[6] - COL_X[5],
        MARGIN + CONTENT_W - COL_X[6],
      ];

      const drawTableHeader = (y: number) => {
        doc.setFillColor(225, 242, 242);
        doc.rect(MARGIN, y, CONTENT_W, ROW_H, 'F');
        doc.setDrawColor(153, 196, 196);
        doc.setLineWidth(0.3);
        doc.rect(MARGIN, y, CONTENT_W, ROW_H, 'D');
        doc.setLineWidth(0.15);
        for (let i = 1; i < COL_X.length; i++) {
          doc.line(COL_X[i], y, COL_X[i], y + ROW_H);
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(26, 58, 58);
        const headers = [
          tReport('colCustomer'),
          tReport('colPhone'),
          tReport('colDish'),
          tReport('colMealDate'),
          tReport('colQty'),
          tReport('colTotal'),
          tReport('colStatus'),
        ];
        headers.forEach((h, i) => {
          doc.text(h, COL_X[i] + 1.5, y + 4.5);
        });
      };

      drawTableHeader(cursorY);
      cursorY += ROW_H;

      const truncate = (text: string, w: number) => {
        const maxChars = Math.floor(w / 1.5);
        return text.length > maxChars ? text.slice(0, maxChars - 1) + '…' : text;
      };

      if (filtered.length === 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(t('empty'), PAGE_W / 2, cursorY + 8, { align: 'center' });
      } else {
        filtered.forEach((r, idx) => {
          if (cursorY + ROW_H > PAGE_H - 18) {
            doc.addPage();
            cursorY = MARGIN;
            drawTableHeader(cursorY);
            cursorY += ROW_H;
          }

          if (idx % 2 === 0) {
            doc.setFillColor(248, 252, 252);
            doc.rect(MARGIN, cursorY, CONTENT_W, ROW_H, 'F');
          }
          doc.setDrawColor(209, 232, 232);
          doc.setLineWidth(0.1);
          doc.rect(MARGIN, cursorY, CONTENT_W, ROW_H, 'D');
          for (let i = 1; i < COL_X.length; i++) {
            doc.line(COL_X[i], cursorY, COL_X[i], cursorY + ROW_H);
          }

          const dishName = r.menu_items?.name ?? '—';
          const mealDate = r.menu_items?.meal_date
            ? format(new Date(r.menu_items.meal_date), 'dd/MM/yyyy')
            : '—';

          const cells = [
            truncate(r.customer_name, colWidths[0]),
            truncate(r.customer_phone, colWidths[1]),
            truncate(dishName, colWidths[2]),
            mealDate,
            String(r.quantity),
            formatCurrency(r.total_amount),
            statusLabel(r),
          ];

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(26, 58, 58);
          cells.forEach((val, i) => {
            const align = i >= 4 ? 'right' : 'left';
            const x = align === 'right' ? COL_X[i] + colWidths[i] - 1.5 : COL_X[i] + 1.5;
            doc.text(val, x, cursorY + 4.5, { align });
          });

          cursorY += ROW_H;
        });

        const totalAll = filtered.reduce((s, r) => s + r.total_amount, 0);
        if (cursorY + ROW_H > PAGE_H - 18) {
          doc.addPage();
          cursorY = MARGIN;
        }
        doc.setFillColor(209, 232, 232);
        doc.rect(MARGIN, cursorY, CONTENT_W, ROW_H, 'F');
        doc.setDrawColor(153, 196, 196);
        doc.setLineWidth(0.3);
        doc.rect(MARGIN, cursorY, CONTENT_W, ROW_H, 'D');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(26, 58, 58);
        doc.text(tReport('reportTotal'), MARGIN + 3, cursorY + 4.5);
        doc.text(formatCurrency(totalAll), MARGIN + CONTENT_W - 3, cursorY + 4.5, { align: 'right' });
      }

      const pageCount = doc.getNumberOfPages();
      for (let p = 1; p <= pageCount; p++) {
        doc.setPage(p);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(160, 160, 160);
        doc.text('Marmita Solidária — Primeira Igreja Baptista de Vila Real', PAGE_W / 2, 290, { align: 'center' });
        doc.text(`${p} / ${pageCount}`, PAGE_W - MARGIN, 290, { align: 'right' });
      }

      const stamp = format(new Date(), 'yyyyMMdd-HHmm');
      doc.save(`reservas-${category}-${stamp}.pdf`);
    } finally {
      setGeneratingPdf(false);
    }
  }

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
              <option key={d} value={d}>{formatDate(d, locale)} {d.slice(0, 4)}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleDownloadPdf}
          disabled={generatingPdf || reservations.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 text-xs bg-teal-700 text-white rounded-lg hover:bg-teal-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed font-medium ml-auto"
          aria-label={tReport('exportButton')}
        >
          <span aria-hidden="true">⬇</span>
          {generatingPdf ? tReport('generating') : tReport('exportButton')}
        </button>
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
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-semibold text-foreground min-w-0">{r.customer_name}</p>
                <p className="font-bold text-teal-700 shrink-0">{formatCurrency(r.total_amount)}</p>
              </div>

              <p className="text-sm text-foreground/60">{r.customer_phone}</p>

              {r.menu_items && (
                <p className="text-sm text-foreground/70 mt-1">
                  {r.quantity}x {r.menu_items.name}{' '}
                  <span className="text-foreground/40">— {formatDate(r.menu_items.meal_date, locale)}</span>
                </p>
              )}

              <p className="text-xs text-foreground/40 mt-1">
                {t('reservedAt', { date: formatDateTime(r.created_at, locale) })}
                {' · '}
                <span className="text-foreground/50">{paymentLabel[r.payment_method] ?? r.payment_method}</span>
              </p>

              <div className="mt-3">
                {r.cancelled ? (
                  <span className="text-xs bg-stone-100 text-stone-500 font-medium px-2 py-0.5 rounded-full">
                    {t('cancelledBadge')}
                  </span>
                ) : r.paid ? (
                  <span className="text-xs bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full">
                    {t('paid')}
                  </span>
                ) : cancelConfirm === r.id ? (
                  <div className="flex items-center gap-1.5 flex-wrap">
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
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => confirmPayment(r.id)}
                      disabled={confirming === r.id}
                      className="text-xs bg-teal-700 hover:bg-teal-800 disabled:bg-teal-300 text-white font-medium px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {confirming === r.id ? t('confirming') : t('confirmPayment')}
                    </button>
                    <button
                      onClick={() => setCancelConfirm(r.id)}
                      className="text-xs bg-red-600 hover:bg-red-700 text-white font-medium px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {t('cancelBtn')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
