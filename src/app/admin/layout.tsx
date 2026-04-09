import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-stone-100">
      <header className="bg-teal-900 text-white px-4 py-3 shadow">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="font-bold text-base text-teal-100">Gestão — Marmita Solidária</h1>
          <nav className="flex gap-4 text-sm">
            <Link href="/admin" className="hover:text-teal-300 transition-colors">
              Reservas
            </Link>
            <Link href="/admin/menu" className="hover:text-teal-300 transition-colors">
              Menu
            </Link>
            <Link href="/admin/meta" className="hover:text-teal-300 transition-colors">
              Objetivo
            </Link>
            <Link href="/" className="text-teal-400 hover:text-white transition-colors">
              ← Site
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {children}
      </main>
    </div>
  );
}
