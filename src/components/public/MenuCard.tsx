'use client';

import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { MenuItem } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

interface MenuCardProps {
  item: MenuItem;
  selected: boolean;
  onSelect: (id: string) => void;
  priority?: boolean;
  disabled?: boolean;
}

export default function MenuCard({ item, selected, onSelect, priority = false, disabled = false }: MenuCardProps) {
  const t = useTranslations('MenuCard');
  const locale = useLocale();

  return (
    <button
      type="button"
      onClick={() => { if (!disabled) onSelect(item.id); }}
      disabled={disabled}
      className={`w-full text-left rounded-xl border-2 overflow-hidden shadow-sm transition-all ${
        disabled
          ? 'border-stone-200 bg-stone-50 opacity-60 cursor-not-allowed'
          : selected
          ? 'border-teal-500 shadow-teal-200 shadow-md cursor-pointer'
          : 'border-stone-200 bg-white hover:border-teal-300 hover:shadow-md cursor-pointer'
      }`}
    >
      {item.image_url ? (
        <div className="relative w-full h-36">
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 50vw"
            priority={priority}
          />
          {(selected || disabled) && (
            <div className="absolute inset-0 bg-teal-600/10 flex items-start justify-end p-2">
              {disabled ? (
                <span className="bg-amber-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {t('deadlinePassed')}
                </span>
              ) : (
                <span className="bg-teal-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {t('selected')}
                </span>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className={`w-full h-16 flex items-center justify-center text-3xl ${
          disabled ? 'bg-stone-100' : selected ? 'bg-teal-50' : 'bg-stone-50'
        }`}>
          🍽️
        </div>
      )}

      <div className={`p-3 ${disabled ? 'bg-stone-50' : selected ? 'bg-teal-50' : 'bg-white'}`}>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-foreground text-sm leading-snug">{item.name}</h3>
          <span className="text-base font-bold text-teal-700 whitespace-nowrap shrink-0">
            {formatCurrency(item.price)}
          </span>
        </div>
        {item.description && (
          <p className="text-xs text-foreground/60 mt-0.5 leading-snug">{item.description}</p>
        )}
        <p className="text-xs text-teal-700 mt-1 font-medium">
          {formatDate(item.meal_date, locale)}
        </p>
        {item.reservation_deadline && (
          <p className={`text-xs mt-1 font-medium ${disabled ? 'text-amber-600' : 'text-stone-400'}`}>
            {disabled ? t('deadlinePassed') : t('deadline', { date: formatDate(item.reservation_deadline, locale) })}
          </p>
        )}
        {disabled && !item.reservation_deadline && !item.image_url && (
          <p className="text-xs text-amber-600 font-semibold mt-1">{t('deadlinePassed')}</p>
        )}
        {selected && !disabled && !item.image_url && (
          <p className="text-xs text-teal-600 font-semibold mt-1">{t('selected')}</p>
        )}
      </div>
    </button>
  );
}
