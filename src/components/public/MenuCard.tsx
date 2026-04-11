'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { MenuItem } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

interface MenuCardProps {
  item: MenuItem;
  selected: boolean;
  onSelect: (id: string) => void;
}

export default function MenuCard({ item, selected, onSelect }: MenuCardProps) {
  const t = useTranslations('MenuCard');

  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      className={`w-full text-left rounded-xl border-2 overflow-hidden shadow-sm transition-all cursor-pointer ${
        selected
          ? 'border-teal-500 shadow-teal-200 shadow-md'
          : 'border-stone-200 bg-white hover:border-teal-300 hover:shadow-md'
      }`}
    >
      {/* Image */}
      {item.image_url ? (
        <div className="relative w-full h-36">
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 50vw"
          />
          {selected && (
            <div className="absolute inset-0 bg-teal-600/10 flex items-start justify-end p-2">
              <span className="bg-teal-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {t('selected')}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className={`w-full h-16 flex items-center justify-center text-3xl ${
          selected ? 'bg-teal-50' : 'bg-stone-50'
        }`}>
          🍽️
        </div>
      )}

      {/* Info */}
      <div className={`p-3 ${selected ? 'bg-teal-50' : 'bg-white'}`}>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-[#1a3a3a] text-sm leading-snug">{item.name}</h3>
          <span className="text-base font-bold text-teal-700 whitespace-nowrap shrink-0">
            {formatCurrency(item.price)}
          </span>
        </div>
        {item.description && (
          <p className="text-xs text-[#1a3a3a]/60 mt-0.5 leading-snug">{item.description}</p>
        )}
        <p className="text-xs text-teal-700 mt-1 font-medium capitalize">
          {formatDate(item.meal_date)}
        </p>
        {selected && !item.image_url && (
          <p className="text-xs text-teal-600 font-semibold mt-1">{t('selected')}</p>
        )}
      </div>
    </button>
  );
}
