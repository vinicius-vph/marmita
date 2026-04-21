'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { format } from 'date-fns';
import { pt, enUS, es } from 'date-fns/locale';
import type { Locale } from 'date-fns';
import type { Category, MonthlyFundraising } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { FUNDRAISING_START_YEAR } from '@/lib/constants';

const localeMap: Record<string, Locale> = { pt, en: enUS, es };

interface Props {
  data: MonthlyFundraising[];
  label: string;
  total: number;
  goal: number;
  category: Category;
}

// SVG canvas dimensions
const W = 600, H = 200, ML = 48, MR = 10, MT = 15, MB = 35;
const IW = W - ML - MR;
const IH = H - MT - MB;

function niceMax(val: number): number {
  if (val <= 0) return 100;
  const exp = Math.floor(Math.log10(val));
  const magnitude = Math.pow(10, exp);
  const step = magnitude >= 1000 ? magnitude / 2 : magnitude;
  return Math.ceil(val / step) * step;
}

function yLabel(val: number): string {
  if (val === 0) return '0';
  if (val >= 1000) {
    const k = val / 1000;
    return `${Number.isInteger(k) ? k : k.toFixed(1)}k€`;
  }
  return `${val}€`;
}

function monthAbbr(month: string, locale: Locale): string {
  try {
    return format(new Date(month + '-01'), 'MMM', { locale });
  } catch {
    return month.slice(5);
  }
}

function monthFull(month: string, locale: Locale): string {
  try {
    return format(new Date(month + '-01'), 'MMMM yyyy', { locale });
  } catch {
    return month;
  }
}

interface ChartProps {
  items: MonthlyFundraising[];
  maxVal: number;
  dfLocale: Locale;
  title: string;
}

function BarChart({ items, maxVal, dfLocale, title }: ChartProps) {
  const n = items.length;
  const slotW = IW / n;
  const barW = Math.min(30, slotW * 0.62);
  const toY = (v: number) => MT + IH - (v / maxVal) * IH;
  const yTicks = [0, 0.25, 0.5, 0.75, 1.0];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={title}>
      {yTicks.map((pct) => {
        const v = maxVal * pct;
        const y = toY(v);
        return (
          <g key={pct}>
            <line
              x1={ML} y1={y} x2={W - MR} y2={y}
              stroke={pct === 0 ? '#99c4c4' : '#d1e8e8'}
              strokeWidth={pct === 0 ? 1.5 : 1}
            />
            <text x={ML - 4} y={y + 3.5} textAnchor="end" fontSize="9" fill="#5a8a8a">
              {yLabel(v)}
            </text>
          </g>
        );
      })}

      {items.map((item, i) => {
        const barH = maxVal > 0 ? Math.max((item.total / maxVal) * IH, 0) : 0;
        const x = ML + i * slotW + (slotW - barW) / 2;
        const y = MT + IH - barH;
        const abbr = monthAbbr(item.month, dfLocale);

        return (
          <g
            key={item.month}
            role="img"
            aria-label={`${monthFull(item.month, dfLocale)}: ${formatCurrency(item.total)}`}
          >
            {barH > 0 && (
              <rect x={x} y={y} width={barW} height={barH} fill="#0d9488" rx="3" opacity="0.85" />
            )}
            <text x={x + barW / 2} y={MT + IH + 14} textAnchor="middle" fontSize="10" fill="#1a3a3a">
              {abbr}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function periodLabel(data: MonthlyFundraising[], page: number, dfLocale: Locale): string {
  const slice = data.slice(page * 6, page * 6 + 6);
  if (slice.length === 0) return '';
  const first = monthAbbr(slice[0].month, dfLocale);
  const last = monthAbbr(slice[slice.length - 1].month, dfLocale);
  return `${first} – ${last}`;
}

export default function FundraisingChart({ data, label, total, goal, category }: Props) {
  const t = useTranslations('FundraisingChart');
  const tTracker = useTranslations('FundraisingTracker');
  const locale = useLocale();
  const dfLocale = localeMap[locale] ?? pt;

  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - FUNDRAISING_START_YEAR + 1 },
    (_, i) => FUNDRAISING_START_YEAR + i,
  );

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [chartData, setChartData] = useState(data);
  const [mobilePage, setMobilePage] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [loadingYear, setLoadingYear] = useState(false);

  async function handleYearChange(year: number) {
    if (year === selectedYear) return;
    setSelectedYear(year);
    setMobilePage(0);
    setLoadingYear(true);
    try {
      const res = await fetch(`/api/fundraising/history?category=${category}&year=${year}`);
      const newData: MonthlyFundraising[] = await res.json();
      setChartData(newData);
    } finally {
      setLoadingYear(false);
    }
  }

  const maxVal = niceMax(Math.max(...chartData.map((d) => d.total), 1));
  const mobileItems = chartData.slice(mobilePage * 6, (mobilePage + 1) * 6);

  async function handleDownloadPdf() {
    setGenerating(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const MARGIN = 15;
      const PAGE_W = 210;
      const CONTENT_W = PAGE_W - MARGIN * 2;

      // --- HEADER ---
      doc.setFillColor(19, 78, 74);
      doc.rect(0, 0, PAGE_W, 28, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(255, 255, 255);
      doc.text('Marmita Solidária', MARGIN, 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(t('reportTitle'), MARGIN, 21);

      const datePattern = locale === 'en' ? 'MMMM d, yyyy' : "d 'de' MMMM 'de' yyyy";
      const dateStr = format(new Date(), datePattern, { locale: dfLocale });
      doc.setFontSize(8);
      doc.text(`${t('generatedOn')} ${dateStr}`, PAGE_W - MARGIN, 21, { align: 'right' });
      doc.text(String(selectedYear), PAGE_W - MARGIN, 27, { align: 'right' });

      // --- CAMPAIGN STATS ---
      doc.setTextColor(26, 58, 58);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(label, MARGIN, 40);

      const pctVal = Math.min(Math.round(goal > 0 ? (total / goal) * 100 : 0), 100);
      const statsData = [
        { lbl: tTracker('goal'), val: formatCurrency(goal) },
        { lbl: tTracker('raised'), val: `${formatCurrency(total)} (${pctVal}%)` },
        { lbl: tTracker('missing'), val: total >= goal ? formatCurrency(0) : formatCurrency(goal - total) },
      ];

      statsData.forEach(({ lbl, val }, i) => {
        const x = MARGIN + i * 61;
        doc.setFillColor(240, 247, 247);
        doc.rect(x, 45, 58, 15, 'F');
        doc.setDrawColor(199, 221, 221);
        doc.setLineWidth(0.2);
        doc.rect(x, 45, 58, 15, 'D');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(90, 138, 138);
        doc.text(lbl.toUpperCase(), x + 4, 51);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(26, 58, 58);
        doc.text(val, x + 4, 57);
      });

      // --- CHART ---
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(26, 58, 58);
      doc.text(t('title').toUpperCase(), MARGIN, 71);

      const CHART_LEFT = MARGIN + 18;
      const CHART_BOTTOM = 115;
      const CHART_H = 38;
      const CHART_W = CONTENT_W - 18;

      // Y grid lines + labels
      const yTicks = [0, 0.25, 0.5, 0.75, 1.0];
      yTicks.forEach((pct) => {
        const v = maxVal * pct;
        const lineY = CHART_BOTTOM - pct * CHART_H;
        doc.setDrawColor(209, 232, 232);
        doc.setLineWidth(pct === 0 ? 0.3 : 0.15);
        doc.line(CHART_LEFT, lineY, CHART_LEFT + CHART_W, lineY);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(90, 138, 138);
        doc.text(yLabel(v), CHART_LEFT - 2, lineY + 1.5, { align: 'right' });
      });

      // Bars + X labels
      const n = chartData.length;
      const slotMM = CHART_W / n;
      const barMM = Math.min(8.5, slotMM * 0.62);

      chartData.forEach((item, i) => {
        const centerX = CHART_LEFT + i * slotMM + slotMM / 2;
        const abbr = monthAbbr(item.month, dfLocale);

        if (item.total > 0) {
          const barH = (item.total / maxVal) * CHART_H;
          const x = CHART_LEFT + i * slotMM + (slotMM - barMM) / 2;
          const y = CHART_BOTTOM - barH;
          doc.setFillColor(13, 148, 136);
          doc.rect(x, y, barMM, barH, 'F');
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(26, 58, 58);
        doc.text(abbr, centerX, CHART_BOTTOM + 5, { align: 'center' });
      });

      // --- TABLE ---
      const TABLE_TOP = 128;
      const ROW_H = 7;
      const COL1 = CONTENT_W * 0.65;
      const COL2 = CONTENT_W * 0.35;

      // Header row
      doc.setFillColor(225, 242, 242);
      doc.rect(MARGIN, TABLE_TOP, CONTENT_W, ROW_H, 'F');
      doc.setDrawColor(153, 196, 196);
      doc.setLineWidth(0.3);
      doc.rect(MARGIN, TABLE_TOP, CONTENT_W, ROW_H, 'D');
      doc.setLineWidth(0.2);
      doc.line(MARGIN + COL1, TABLE_TOP, MARGIN + COL1, TABLE_TOP + ROW_H);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(26, 58, 58);
      doc.text(t('reportMonth'), MARGIN + 3, TABLE_TOP + 4.5);
      doc.text(t('reportAmount'), MARGIN + CONTENT_W - 3, TABLE_TOP + 4.5, { align: 'right' });

      // Data rows
      chartData.forEach((row, i) => {
        const rowY = TABLE_TOP + (i + 1) * ROW_H;

        if (i % 2 === 0) {
          doc.setFillColor(248, 252, 252);
          doc.rect(MARGIN, rowY, CONTENT_W, ROW_H, 'F');
        }

        doc.setDrawColor(209, 232, 232);
        doc.setLineWidth(0.1);
        doc.rect(MARGIN, rowY, CONTENT_W, ROW_H, 'D');
        doc.line(MARGIN + COL1, rowY, MARGIN + COL1, rowY + ROW_H);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(26, 58, 58);
        doc.text(monthFull(row.month, dfLocale), MARGIN + 3, rowY + 4.5);
        doc.text(formatCurrency(row.total), MARGIN + CONTENT_W - 3, rowY + 4.5, { align: 'right' });
      });

      // Total row
      const totalRowY = TABLE_TOP + (data.length + 1) * ROW_H;
      doc.setFillColor(209, 232, 232);
      doc.rect(MARGIN, totalRowY, CONTENT_W, ROW_H, 'F');
      doc.setDrawColor(153, 196, 196);
      doc.setLineWidth(0.3);
      doc.rect(MARGIN, totalRowY, CONTENT_W, ROW_H, 'D');
      doc.line(MARGIN + COL1, totalRowY, MARGIN + COL1, totalRowY + ROW_H);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(26, 58, 58);
      doc.text(t('reportTotal'), MARGIN + 3, totalRowY + 4.5);
      doc.text(formatCurrency(total), MARGIN + CONTENT_W - 3, totalRowY + 4.5, { align: 'right' });

      // Footer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(160, 160, 160);
      doc.text('Marmita Solidária — Primeira Igreja Baptista de Vila Real', PAGE_W / 2, 290, { align: 'center' });

      const slug = label.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-');
      doc.save(`relatorio-${slug}.pdf`);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <section className="mt-6 pt-5 border-t border-teal-200">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-teal-900">{t('title')}</h3>
          <p className="text-xs text-teal-600">{t('subtitle')}</p>
        </div>
        <button
          onClick={handleDownloadPdf}
          disabled={generating || loadingYear}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-teal-700 text-white rounded-lg hover:bg-teal-800 transition-colors disabled:opacity-60 disabled:cursor-wait"
          aria-label={t('printButton')}
        >
          <span aria-hidden="true">⬇</span>
          {generating ? t('generating') : t('printButton')}
        </button>
      </div>

      {/* Year selector */}
      {years.length > 1 && (
        <div className="flex gap-1 mb-3">
          {years.map((year) => (
            <button
              key={year}
              onClick={() => handleYearChange(year)}
              disabled={loadingYear}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors disabled:cursor-wait ${
                selectedYear === year
                  ? 'bg-teal-700 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      )}

      {/* Desktop: all 12 months */}
      <div className={`hidden sm:block transition-opacity ${loadingYear ? 'opacity-40' : 'opacity-100'}`}>
        <BarChart items={chartData} maxVal={maxVal} dfLocale={dfLocale} title={t('title')} />
      </div>

      {/* Mobile: 6 months + pagination */}
      <div className={`block sm:hidden transition-opacity ${loadingYear ? 'opacity-40' : 'opacity-100'}`}>
        <BarChart items={mobileItems} maxVal={maxVal} dfLocale={dfLocale} title={t('title')} />
        <div className="flex items-center justify-between mt-1 px-1">
          <button
            onClick={() => setMobilePage(0)}
            disabled={mobilePage === 0}
            className="px-2 py-1 text-xs text-teal-700 font-medium disabled:text-stone-300 disabled:cursor-not-allowed"
            aria-label={t('prevPeriod')}
          >
            ← {t('prevPeriod')}
          </button>
          <span className="text-xs text-stone-500">{periodLabel(chartData, mobilePage, dfLocale)}</span>
          <button
            onClick={() => setMobilePage(1)}
            disabled={mobilePage === 1}
            className="px-2 py-1 text-xs text-teal-700 font-medium disabled:text-stone-300 disabled:cursor-not-allowed"
            aria-label={t('nextPeriod')}
          >
            {t('nextPeriod')} →
          </button>
        </div>
      </div>
    </section>
  );
}
