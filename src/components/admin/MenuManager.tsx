'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { MenuItem, Category } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import MenuForm from './MenuForm';

export default function MenuManager({ items: initial, category }: { items: MenuItem[]; category: Category }) {
  const router = useRouter();
  const t = useTranslations('MenuManager');
  const locale = useLocale();
  const [items, setItems] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeleting(id);
    setPendingDelete(null);
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
    fetch(`/api/menu?category=${category}`)
      .then((r) => r.json())
      .then(setItems)
      .catch(() => {});
  }

  return (
    <div className="space-y-6">
      {(showForm || editing) ? (
        <MenuForm
          editing={editing}
          category={category}
          onSaved={handleSaved}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
        >
          {t('add')}
        </button>
      )}

      {items.length === 0 ? (
        <p className="text-foreground/40 text-center py-8">{t('empty')}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm flex items-start justify-between gap-3 flex-wrap">
              <div>
                <p className="font-semibold text-foreground">{item.name}</p>
                {item.description && (
                  <p className="text-sm text-foreground/60 mt-0.5">{item.description}</p>
                )}
                <p className="text-xs text-teal-700 mt-1">{formatDate(item.meal_date, locale)}</p>
              </div>
              <div className="text-right shrink-0 flex flex-col items-end gap-2">
                <p className="font-bold text-teal-700">{formatCurrency(item.price)}</p>
                {pendingDelete === item.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-600 font-medium">{t('confirmRemove')}</span>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deleting === item.id}
                      className="text-xs bg-red-600 hover:bg-red-700 text-white font-medium px-3 py-1 rounded-full transition-colors disabled:opacity-50"
                    >
                      {deleting === item.id ? '...' : t('confirmYes')}
                    </button>
                    <button
                      onClick={() => setPendingDelete(null)}
                      className="text-xs bg-stone-100 hover:bg-stone-200 text-foreground/70 font-medium px-3 py-1 rounded-full transition-colors"
                    >
                      {t('confirmNo')}
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditing(item); setShowForm(false); }}
                      className="text-xs bg-stone-100 hover:bg-stone-200 text-foreground/70 font-medium px-3 py-1 rounded-full transition-colors"
                    >
                      {t('edit')}
                    </button>
                    <button
                      onClick={() => setPendingDelete(item.id)}
                      disabled={deleting === item.id}
                      className="text-xs bg-red-50 hover:bg-red-100 text-red-600 font-medium px-3 py-1 rounded-full transition-colors disabled:opacity-50"
                    >
                      {t('remove')}
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
