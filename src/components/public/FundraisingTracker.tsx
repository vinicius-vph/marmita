import { FundraisingSummary } from '@/types';
import { formatCurrency } from '@/lib/utils';

export default function FundraisingTracker({ data }: { data: FundraisingSummary }) {
  const { goal, label, raised, remaining } = data;
  const percentage = Math.min(Math.round((raised / goal) * 100), 100);
  const goalReached = raised >= goal;

  return (
    <section className="bg-teal-50 border border-teal-200 rounded-2xl p-6 md:p-8">
      <h2 className="text-xl font-bold text-teal-900 mb-1">{label}</h2>
      <p className="text-sm text-teal-700 mb-4">
        Cada refeição comprada aproxima-nos do nosso objetivo!
      </p>

      <div className="w-full bg-teal-100 rounded-full h-5 mb-4 overflow-hidden">
        <div
          className="progress-bar-fill h-5 rounded-full bg-teal-600"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex justify-between text-sm font-medium text-teal-800 mb-1">
        <span>{percentage}% alcançado</span>
        <span>{formatCurrency(goal)}</span>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="bg-white rounded-xl p-3 text-center shadow-sm">
          <p className="text-xs text-[#1a3a3a]/50 uppercase tracking-wide mb-1">Angariado</p>
          <p className="text-lg font-bold text-green-700">{formatCurrency(raised)}</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm">
          <p className="text-xs text-[#1a3a3a]/50 uppercase tracking-wide mb-1">Objetivo</p>
          <p className="text-lg font-bold text-teal-700">{formatCurrency(goal)}</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm">
          <p className="text-xs text-[#1a3a3a]/50 uppercase tracking-wide mb-1">Falta</p>
          <p className="text-lg font-bold text-[#1a3a3a]">
            {goalReached ? '🎉 Meta!' : formatCurrency(remaining)}
          </p>
        </div>
      </div>

      {goalReached && (
        <p className="mt-4 text-center text-green-700 font-semibold">
          Objetivo alcançado! Obrigado pela vossa generosidade!
        </p>
      )}
    </section>
  );
}
