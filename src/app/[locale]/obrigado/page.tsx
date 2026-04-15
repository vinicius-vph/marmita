import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { formatCurrency, formatPhone, whatsappUrl } from '@/lib/utils';
import { env } from '@/env';
import MbwayPaymentGuide from '@/components/public/MbwayPaymentGuide';

interface Props {
  searchParams: Promise<{
    nome?: string;
    prato?: string;
    quantidade?: string;
    total?: string;
    categoria?: string;
  }>;
}

export default async function ObrigadoPage({ searchParams }: Props) {
  const params = await searchParams;
  const nome = params.nome ?? 'Cliente';
  const prato = params.prato ?? 'Refeição';
  const quantidade = parseInt(params.quantidade ?? '1', 10);
  const total = parseFloat(params.total ?? '0');
  const isBreakfast = params.categoria === 'breakfast';
  const mbwayPhone = formatPhone(env.MBWAY_PHONE);
  const waPhone = env.WHATSAPP_PHONE || env.MBWAY_PHONE;
  const waUrl = whatsappUrl(waPhone);
  const tHome = await getTranslations('Home');
  const tThankYou = await getTranslations('ThankYou');
  const reference = isBreakfast
    ? tThankYou('step5refBreakfast', { dish: prato, name: nome })
    : tThankYou('step5ref', { dish: prato, name: nome });

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-teal-800 text-white py-5 px-4 shadow-md">
        <Link href="/" className="max-w-3xl mx-auto flex items-center gap-4 hover:opacity-90 transition-opacity">
          <Image
            src="/logo.jpg"
            alt="Primeira Igreja Baptista de Vila Real"
            width={52}
            height={52}
            className="rounded-full border-2 border-teal-300 shadow"
            priority
          />
          <div>
            <h1 className="text-xl font-bold">Marmita Solidária</h1>
            <p className="text-teal-200 text-xs">Primeira Igreja Baptista de Vila Real</p>
          </div>
        </Link>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10">
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 md:p-8 space-y-6">
          <div className="text-center">
            <div className="text-5xl mb-3">{isBreakfast ? '☕' : '🙏'}</div>
            <h2 className="text-2xl font-bold text-[#1a3a3a]">
              {tThankYou('title', { name: nome })}
            </h2>
            <p className="text-[#1a3a3a]/60 mt-1">
              {isBreakfast ? tThankYou('subtitleBreakfast') : tThankYou('subtitle')}
            </p>
          </div>

          <div className="bg-stone-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#1a3a3a]/60">{tThankYou('dish')}</span>
              <span className="font-medium text-[#1a3a3a]">{prato}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#1a3a3a]/60">{tThankYou('quantity')}</span>
              <span className="font-medium text-[#1a3a3a]">{quantidade}x</span>
            </div>
            <div className="flex justify-between border-t border-stone-200 pt-2 mt-2">
              <span className="text-[#1a3a3a] font-semibold">{tThankYou('total')}</span>
              <span className="font-bold text-teal-700 text-base">{formatCurrency(total)}</span>
            </div>
          </div>

          <MbwayPaymentGuide
            phone={mbwayPhone}
            rawPhone={env.MBWAY_PHONE}
            amount={formatCurrency(total)}
            reference={reference}
          />

          <p className="text-center text-sm text-[#1a3a3a]/50">{tThankYou('disclaimer')}</p>

          <div className="text-center">
            <Link
              href="/"
              className="inline-block bg-teal-700 hover:bg-teal-800 text-white font-bold px-6 py-3 rounded-xl transition-colors"
            >
              {tThankYou('back')}
            </Link>
          </div>
        </div>
      </main>

      <footer className="bg-teal-900 text-teal-200 py-4 px-4 text-center text-sm">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <Image src="/mbway.png" alt="MB WAY" width={80} height={26} className="inline-block" style={{ height: 'auto' }} />
          <span>
            {tHome('payment')}{' '}
            <span className="font-bold text-white tracking-widest hover:text-teal-300 transition-colors">
              {mbwayPhone}
            </span>
          </span>
        </div>

        <div className="flex items-center justify-center gap-2 flex-wrap mb-3">
          <span>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-white tracking-widest hover:text-teal-300 transition-colors"
              >
              {tHome('info')}{' '}
            </a>
          </span>
        </div>

        {(env.INSTAGRAM_URL || env.FACEBOOK_URL) && (
          <div className="flex items-center justify-center gap-4 mb-3">
            {env.INSTAGRAM_URL && (
              <a
                href={env.INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-teal-300 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            )}
            {env.FACEBOOK_URL && (
              <a
                href={env.FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="text-teal-300 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
            )}
          </div>
        )}
      </footer>
    </div>
  );
}
