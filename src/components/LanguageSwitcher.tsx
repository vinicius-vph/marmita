'use client';

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

  function switchLocale(next: string) {
    const search = searchParams.toString();
    const fullPath = search ? `${pathname}?${search}` : pathname;
    router.replace(fullPath, { locale: next });
  }

  return (
    <div className="flex items-center gap-1">
      {routing.locales.map((loc) => (
        <button
          key={loc}
          onClick={() => switchLocale(loc)}
          className={`text-xs font-semibold px-3 py-2 rounded transition-colors ${
            locale === loc
              ? 'bg-white/20 text-white'
              : 'text-white/50 hover:text-white hover:bg-white/10'
          }`}
        >
          {labels[loc]}
        </button>
      ))}
    </div>
  );
}
