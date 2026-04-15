import { useTranslations } from 'next-intl';
import { FundraisingSummary } from '@/types';
import { formatCurrency } from '@/lib/utils';

export default function FundraisingTracker({ data }: { data: FundraisingSummary }) {
  const { goal, label, raised, remaining } = data;
  const percentage = Math.min(Math.round((raised / goal) * 100), 100);
  const goalReached = raised >= goal;
  const t = useTranslations('FundraisingTracker');

  return (
    <section className="bg-teal-50 border border-teal-200 rounded-2xl p-6 md:p-8">
      <h2 className="text-xl font-bold text-teal-900 mb-1">{label}</h2>
      <p className="text-sm text-teal-700 mb-4">{t('tagline')}</p>

      <div className="w-full bg-teal-100 rounded-full h-5 mb-4 overflow-hidden">
        <div
          className="progress-bar-fill h-5 rounded-full bg-teal-600"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex justify-between text-sm font-medium text-teal-800 mb-1">
        <span>{t('percentage', { value: percentage })}</span>
        <span>{formatCurrency(goal)}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className="bg-white rounded-xl p-2 md:p-3 text-center shadow-sm">
          <p className="text-xs text-foreground/50 uppercase tracking-wide mb-1">{t('raised')}</p>
          <p className="text-sm md:text-base font-bold text-green-700 break-all">{formatCurrency(raised)}</p>
        </div>
        <div className="bg-white rounded-xl p-2 md:p-3 text-center shadow-sm">
          <p className="text-xs text-foreground/50 uppercase tracking-wide mb-1">{t('goal')}</p>
          <p className="text-sm md:text-base font-bold text-teal-700 break-all">{formatCurrency(goal)}</p>
        </div>
        <div className="bg-white rounded-xl p-2 md:p-3 text-center shadow-sm">
          <p className="text-xs text-foreground/50 uppercase tracking-wide mb-1">{t('missing')}</p>
          <p className="text-sm md:text-base font-bold text-foreground break-all">
            {goalReached ? t('goalReachedShort') : formatCurrency(remaining)}
          </p>
        </div>
      </div>

      {goalReached && (
        <p className="mt-4 text-center text-green-700 font-semibold">{t('goalReached')}</p>
      )}
    </section>
  );
}
