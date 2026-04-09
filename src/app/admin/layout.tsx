import Link from 'next/link';
import { getAdminSession } from '@/lib/auth';
import LogoutButton from '@/components/admin/LogoutButton';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const isLoggedIn = await getAdminSession();

  return (
    <div className="min-h-screen flex flex-col bg-stone-100">
      <header className="bg-teal-900 text-white px-4 py-3 shadow">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-bold text-base text-teal-100 hover:text-white transition-colors">
            Gestão — Marmita Solidária
          </Link>

          {isLoggedIn && (
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/admin" className="hover:text-teal-300 transition-colors">
                Reservas
              </Link>
              <Link href="/admin/menu" className="hover:text-teal-300 transition-colors">
                Menu
              </Link>
              <Link href="/admin/meta" className="hover:text-teal-300 transition-colors">
                Objetivo
              </Link>
              <span className="text-teal-700">|</span>
              <LogoutButton />
            </nav>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {children}
      </main>
    </div>
  );
}
