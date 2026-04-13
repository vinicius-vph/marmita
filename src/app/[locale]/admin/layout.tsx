import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getAdminSession } from '@/lib/auth';
import AdminNav from '@/components/admin/AdminNav';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const isLoggedIn = await getAdminSession();
  const t = await getTranslations('AdminLayout');

  return (
    <div className="min-h-screen flex flex-col bg-stone-100">
      <header className="bg-teal-900 text-white px-4 py-3 shadow">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <Link href="/" className="font-bold text-base text-teal-100 hover:text-white transition-colors">
            {t('title')}
          </Link>

          <div className="flex items-center gap-4">
            {isLoggedIn && (
              <Suspense>
                <AdminNav />
              </Suspense>
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
