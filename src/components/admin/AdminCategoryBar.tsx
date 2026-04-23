'use client';

import { useSearchParams } from 'next/navigation';
import { usePathname, Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

export default function AdminCategoryBar() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const tCat = useTranslations('CategoryTabs');
  const category = searchParams.get('category') === 'breakfast' ? 'breakfast' : 'meals';

  return (
    <div className="bg-teal-800 px-4">
      <div className="max-w-5xl mx-auto flex gap-0.5 py-1.5">
        <Link
          replace
          href={`${pathname}?category=meals`}
          className={`px-4 py-1 rounded-md text-xs font-medium transition-all ${
            category === 'meals'
              ? 'bg-white text-teal-900 font-bold'
              : 'text-teal-200 hover:text-white'
          }`}
        >
          {tCat('meals')}
        </Link>
        <Link
          replace
          href={`${pathname}?category=breakfast`}
          className={`px-4 py-1 rounded-md text-xs font-medium transition-all ${
            category === 'breakfast'
              ? 'bg-amber-50 text-amber-900 font-bold'
              : 'text-teal-200 hover:text-white'
          }`}
        >
          {tCat('breakfast')}
        </Link>
      </div>
    </div>
  );
}
