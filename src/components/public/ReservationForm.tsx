'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MenuItem } from '@/types';
import MenuCard from './MenuCard';
import { formatCurrency } from '@/lib/utils';

export default function ReservationForm({ menuItems }: { menuItems: MenuItem[] }) {
  const router = useRouter();
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

    if (!selectedId) { setError('Por favor selecione um prato.'); return; }
    if (name.trim().length < 3) { setError('Por favor insira o seu nome completo.'); return; }
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 9) { setError('Por favor insira um número de telefone válido.'); return; }
    if (quantity < 1) { setError('A quantidade deve ser pelo menos 1.'); return; }

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
      if (!res.ok) { setError(data.error ?? 'Erro ao submeter reserva.'); setLoading(false); return; }

      const params = new URLSearchParams({
        nome: name.trim(),
        prato: selectedItem?.name ?? '',
        quantidade: String(quantity),
        total: String(data.total_amount),
      });
      router.push(`/obrigado?${params.toString()}`);
    } catch {
      setError('Erro de ligação. Por favor tente novamente.');
      setLoading(false);
    }
  }

  if (menuItems.length === 0) {
    return (
      <div className="text-center py-8 text-[#1a3a3a]/50">
        Não há pratos disponíveis para esta semana. Volte em breve!
      </div>
    );
  }

  return (
    <section id="reserva" className="space-y-6">
      <h2 className="text-2xl font-bold text-[#1a3a3a]">Fazer Reserva</h2>

      <div>
        <p className="text-sm font-medium text-[#1a3a3a]/70 mb-3">Escolha o prato:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {menuItems.map((item) => (
            <MenuCard
              key={item.id}
              item={item}
              selected={selectedId === item.id}
              onSelect={setSelectedId}
            />
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-[#1a3a3a] mb-1">
            Nome completo *
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Maria Silva"
            required
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-[#1a3a3a] mb-1">
            Telefone *
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="912 345 678"
            required
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
        </div>

        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-[#1a3a3a] mb-1">
            Quantidade *
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-9 h-9 rounded-full border border-stone-300 text-lg font-bold text-[#1a3a3a]/60 hover:bg-stone-100 flex items-center justify-center"
            >
              −
            </button>
            <span className="text-xl font-bold text-[#1a3a3a] w-8 text-center">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(20, q + 1))}
              className="w-9 h-9 rounded-full border border-stone-300 text-lg font-bold text-[#1a3a3a]/60 hover:bg-stone-100 flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>

        {selectedItem && (
          <div className="bg-teal-50 rounded-lg p-3 text-sm">
            <span className="text-[#1a3a3a]/70">Total a pagar via MBWay: </span>
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
          {loading ? 'A submeter...' : 'Confirmar Reserva'}
        </button>
      </form>
    </section>
  );
}
