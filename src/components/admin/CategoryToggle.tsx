'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function CategoryToggle() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const t = useTranslations('CategoryTabs');
  const current = searchParams.get('category') === 'breakfast' ? 'breakfast' : 'meals';

  const setCategory = (cat: 'meals' | 'breakfast') => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('category', cat);
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex gap-1 p-1 bg-stone-200 rounded-xl mb-6">
      <button
        onClick={() => setCategory('meals')}
        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
          current === 'meals'
            ? 'bg-white text-teal-800 shadow-sm font-bold'
            : 'text-stone-500 hover:text-stone-700'
        }`}
      >
        {t('meals')}
      </button>
      <button
        onClick={() => setCategory('breakfast')}
        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
          current === 'breakfast'
            ? 'bg-white text-amber-800 shadow-sm font-bold'
            : 'text-stone-500 hover:text-stone-700'
        }`}
      >
        {t('breakfast')}
      </button>
    </div>
  );
}
