'use client';

import { useSearchParams } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import LogoutButton from './LogoutButton';

export default function AdminNav() {
  const searchParams = useSearchParams();
  const category = searchParams.get('category') === 'breakfast' ? 'breakfast' : 'meals';
  const t = useTranslations('AdminLayout');
  const navLink = (path: string) => `${path}?category=${category}`;

  return (
    <nav className="flex items-center justify-between pb-4 text-sm">
      <div className="flex items-center gap-6">
        <Link href={navLink('/admin')} className="hover:text-teal-300 transition-colors">
          {t('reservations')}
        </Link>
        <Link href={navLink('/admin/menu')} className="hover:text-teal-300 transition-colors">
          {t('menu')}
        </Link>
        <Link href={navLink('/admin/meta')} className="hover:text-teal-300 transition-colors">
          {t('goal')}
        </Link>
      </div>
      <LogoutButton />
    </nav>
  );
}
