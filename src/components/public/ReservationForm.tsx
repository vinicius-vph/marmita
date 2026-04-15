'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { MenuItem, Category } from '@/types';
import MenuCard from './MenuCard';
import { formatCurrency } from '@/lib/utils';

export default function ReservationForm({ menuItems, category }: { menuItems: MenuItem[]; category: Category }) {
  const router = useRouter();
  const t = useTranslations('ReservationForm');
  const [selectedId, setSelectedId] = useState<string>(menuItems[0]?.id ?? '');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedItem = menuItems.find((m) => m.id === selectedId);
  const total = selectedItem ? selectedItem.price * quantity : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!selectedId) { setError(t('errorNoDish')); return; }
    if (name.trim().length < 3) { setError(t('errorName')); return; }
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 9) { setError(t('errorPhone')); return; }
    if (quantity < 1) { setError(t('errorQuantity')); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menu_item_id: selectedId,
          customer_name: name.trim(),
          customer_phone: phone.trim(),
          quantity,
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error ?? t('errorSubmit')); setLoading(false); return; }

      const params = new URLSearchParams({
        nome: name.trim(),
        prato: selectedItem?.name ?? '',
        quantidade: String(quantity),
        total: String(data.total_amount),
        categoria: category,
      });
      router.push(`/obrigado?${params.toString()}`);
    } catch {
      setError(t('errorConnection'));
      setLoading(false);
    }
  }

  if (menuItems.length === 0) {
    return (
      <div className="text-center py-8 text-foreground/50">
        {t('noMeals')}
      </div>
    );
  }

  return (
    <section id="reserva" className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">{t('title')}</h2>

      <div>
        <p className="text-sm font-medium text-foreground/70 mb-3">{t('chooseDish')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {menuItems.map((item, index) => {
            const isLastAlone = menuItems.length % 2 !== 0 && index === menuItems.length - 1;
            return (
              <div key={item.id} className={isLastAlone ? 'sm:col-span-2' : undefined}>
                <MenuCard
                  item={item}
                  selected={selectedId === item.id}
                  onSelect={setSelectedId}
                  priority={index === 0}
                />
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
            {t('fullName')}
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            placeholder="Maria Silva"
            required
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1">
            {t('phone')}
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setError(''); }}
            placeholder="912 345 678"
            required
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
        </div>

        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-foreground mb-1">
            {t('quantity')}
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-9 h-9 rounded-full border border-stone-300 text-lg font-bold text-foreground/60 hover:bg-stone-100 flex items-center justify-center"
            >
              −
            </button>
            <span className="text-xl font-bold text-foreground w-8 text-center">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(20, q + 1))}
              className="w-9 h-9 rounded-full border border-stone-300 text-lg font-bold text-foreground/60 hover:bg-stone-100 flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>

        {selectedItem && (
          <div className="bg-teal-50 rounded-lg p-3 text-sm">
            <span className="text-foreground/70">{t('totalLabel')}</span>
            <span className="font-bold text-teal-800 text-base">{formatCurrency(total)}</span>
          </div>
        )}

        {error && (
          <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-teal-700 hover:bg-teal-800 disabled:bg-teal-300 text-white font-bold py-3 rounded-xl transition-colors"
        >
          {loading ? t('submitting') : t('submit')}
        </button>
      </form>
    </section>
  );
}
