'use client';

import { useSearchParams } from 'next/navigation';
import { usePathname, Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import LogoutButton from './LogoutButton';

export default function AdminNav() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const t = useTranslations('AdminLayout');
  const tCat = useTranslations('CategoryTabs');
  const category = searchParams.get('category') === 'breakfast' ? 'breakfast' : 'meals';

  const navLink = (path: string) => `${path}?category=${category}`;

  return (
    <div className="flex flex-col items-end gap-1.5">
      {/* Links de navegação */}
      <nav className="flex items-center gap-3 flex-wrap text-sm">
        <Link href={navLink('/admin')} className="hover:text-teal-300 transition-colors">
          {t('reservations')}
        </Link>
        <Link href={navLink('/admin/menu')} className="hover:text-teal-300 transition-colors">
          {t('menu')}
        </Link>
        <Link href={navLink('/admin/meta')} className="hover:text-teal-300 transition-colors">
          {t('goal')}
        </Link>
        <span className="text-teal-700">|</span>
        <LogoutButton />
      </nav>

      {/* Toggle de categoria */}
      <div className="flex gap-0.5 p-0.5 bg-teal-800/60 rounded-lg">
        <Link
          replace
          href={`${pathname}?category=meals`}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
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
          className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
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
