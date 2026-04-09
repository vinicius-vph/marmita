'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MenuItem } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import MenuForm from './MenuForm';

export default function MenuManager({ items: initial }: { items: MenuItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm('Remover este prato do menu?')) return;
    setDeleting(id);
    const res = await fetch(`/api/menu/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      router.refresh();
    }
    setDeleting(null);
  }

  function handleSaved() {
    setShowForm(false);
    setEditing(null);
    router.refresh();
    fetch('/api/menu')
      .then((r) => r.json())
      .then(setItems)
      .catch(() => {});
  }

  return (
    <div className="space-y-6">
      {(showForm || editing) ? (
        <MenuForm
          editing={editing}
          onSaved={handleSaved}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
        >
          + Adicionar prato
        </button>
      )}

      {items.length === 0 ? (
        <p className="text-[#1a3a3a]/40 text-center py-8">Nenhum prato no menu. Adicione um acima.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm flex items-start justify-between gap-3 flex-wrap">
              <div>
                <p className="font-semibold text-[#1a3a3a]">{item.name}</p>
                {item.description && (
                  <p className="text-sm text-[#1a3a3a]/60 mt-0.5">{item.description}</p>
                )}
                <p className="text-xs text-teal-700 mt-1 capitalize">{formatDate(item.meal_date)}</p>
              </div>
              <div className="text-right shrink-0 flex flex-col items-end gap-2">
                <p className="font-bold text-teal-700">{formatCurrency(item.price)}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditing(item); setShowForm(false); }}
                    className="text-xs bg-stone-100 hover:bg-stone-200 text-[#1a3a3a]/70 font-medium px-3 py-1 rounded-full transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deleting === item.id}
                    className="text-xs bg-red-50 hover:bg-red-100 text-red-600 font-medium px-3 py-1 rounded-full transition-colors disabled:opacity-50"
                  >
                    {deleting === item.id ? '...' : 'Remover'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
