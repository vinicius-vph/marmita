'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';

const labels: Record<string, string> = {
  pt: 'PT',
  en: 'EN',
  es: 'ES',
};

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function switchLocale(next: string) {
    const search = searchParams.toString();
    const fullPath = search ? `${pathname}?${search}` : pathname;
    router.replace(fullPath, { locale: next });
    setOpen(false);
  }

  const others = routing.locales.filter((loc) => loc !== locale);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded bg-white/20 text-white hover:bg-white/30 transition-colors"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {labels[locale]}
        <svg
          className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 10 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M1 1l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 mt-1 bg-teal-900 rounded shadow-lg overflow-hidden z-50 min-w-[3.5rem]"
        >
          {others.map((loc) => (
            <button
              key={loc}
              role="option"
              aria-selected={false}
              onClick={() => switchLocale(loc)}
              className="block w-full text-xs font-semibold px-3 py-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors text-center"
            >
              {labels[loc]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
