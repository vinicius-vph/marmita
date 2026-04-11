import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getAdminSession } from '@/lib/auth';
import LogoutButton from '@/components/admin/LogoutButton';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const isLoggedIn = await getAdminSession();
  const t = await getTranslations('AdminLayout');

  return (
    <div className="min-h-screen flex flex-col bg-stone-100">
      <header className="bg-teal-900 text-white px-4 py-3 shadow">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-bold text-base text-teal-100 hover:text-white transition-colors">
            {t('title')}
          </Link>

          <div className="flex items-center gap-4">
            {isLoggedIn && (
              <nav className="flex items-center gap-4 text-sm">
                <Link href="/admin" className="hover:text-teal-300 transition-colors">
                  {t('reservations')}
                </Link>
                <Link href="/admin/menu" className="hover:text-teal-300 transition-colors">
                  {t('menu')}
                </Link>
                <Link href="/admin/meta" className="hover:text-teal-300 transition-colors">
                  {t('goal')}
                </Link>
                <span className="text-teal-700">|</span>
                <LogoutButton />
              </nav>
            )}
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {children}
      </main>
    </div>
  );
}
