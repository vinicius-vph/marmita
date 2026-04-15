'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FundraisingSummary } from '@/types';
import { formatCurrency } from '@/lib/utils';

export default function GoalForm({ data: initial }: { data: FundraisingSummary }) {
  const category = initial.category;
  const t = useTranslations('GoalForm');
  const [data, setData] = useState(initial);
  const [goal, setGoal] = useState(String(initial.goal));
  const [label, setLabel] = useState(initial.label);
  const [manualRaised, setManualRaised] = useState(String(initial.raised));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const res = await fetch('/api/admin/meta', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal, label, manual_raised: manualRaised, category }),
    });

    if (res.ok) {
      const newGoal = parseFloat(goal);
      const newRaised = parseFloat(manualRaised);
      setData({ category, goal: newGoal, label, raised: newRaised, remaining: newGoal - newRaised });
      setMessage(t('success'));
    } else {
      const d = await res.json();
      setError(d.error ?? t('errorDefault'));
    }
    setLoading(false);
  }

  const percentage = Math.min(Math.round((data.raised / data.goal) * 100), 100);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-xs text-green-600 uppercase tracking-wide">{t('raised')}</p>
          <p className="text-xl font-bold text-green-700">{formatCurrency(data.raised)}</p>
        </div>
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
          <p className="text-xs text-teal-600 uppercase tracking-wide">{t('goal')}</p>
          <p className="text-xl font-bold text-teal-700">{formatCurrency(data.goal)}</p>
        </div>
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
          <p className="text-xs text-foreground/50 uppercase tracking-wide">{t('missing')}</p>
          <p className="text-xl font-bold text-foreground">{formatCurrency(Math.max(0, data.remaining))}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 p-3">
        <div className="w-full bg-teal-100 rounded-full h-4 overflow-hidden">
          <div
            className="h-4 rounded-full bg-teal-600 transition-all duration-700"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="text-xs text-center text-foreground/50 mt-1">{t('percentage', { value: percentage })}</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-foreground">{t('updateTitle')}</h3>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">{t('campaign')}</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">{t('goalAmount')}</label>
          <input
            type="number"
            step="0.01"
            min="1"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            required
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">{t('raisedAmount')}</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={manualRaised}
            onChange={(e) => setManualRaised(e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
          <p className="text-xs text-foreground/40 mt-1">{t('hint')}</p>
        </div>

        {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        {message && <p className="text-green-700 text-sm bg-green-50 rounded-lg px-3 py-2">{message}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-teal-700 hover:bg-teal-800 disabled:bg-teal-300 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
        >
          {loading ? t('saving') : t('save')}
        </button>
      </form>
    </div>
  );
}
