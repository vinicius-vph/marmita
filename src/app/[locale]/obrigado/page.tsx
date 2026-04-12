import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { formatCurrency, formatPhone } from '@/lib/utils';
import { env } from '@/env';

interface Props {
  searchParams: Promise<{
    nome?: string;
    prato?: string;
    quantidade?: string;
    total?: string;
  }>;
}

export default async function ObrigadoPage({ searchParams }: Props) {
  const params = await searchParams;
  const nome = params.nome ?? 'Cliente';
  const prato = params.prato ?? 'Refeição';
  const quantidade = parseInt(params.quantidade ?? '1', 10);
  const total = parseFloat(params.total ?? '0');
  const mbwayPhone = formatPhone(env.MBWAY_PHONE);
  const t = await getTranslations('ThankYou');

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-teal-800 text-white py-5 px-4 shadow-md">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
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
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10">
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 md:p-8 space-y-6">
          <div className="text-center">
            <div className="text-5xl mb-3">🙏</div>
            <h2 className="text-2xl font-bold text-[#1a3a3a]">
              {t('title', { name: nome })}
            </h2>
            <p className="text-[#1a3a3a]/60 mt-1">{t('subtitle')}</p>
          </div>

          <div className="bg-stone-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#1a3a3a]/60">{t('dish')}</span>
              <span className="font-medium text-[#1a3a3a]">{prato}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#1a3a3a]/60">{t('quantity')}</span>
              <span className="font-medium text-[#1a3a3a]">{quantidade}x</span>
            </div>
            <div className="flex justify-between border-t border-stone-200 pt-2 mt-2">
              <span className="text-[#1a3a3a] font-semibold">{t('total')}</span>
              <span className="font-bold text-teal-700 text-base">{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="bg-teal-50 border border-teal-200 rounded-xl p-5 space-y-3">
            <h3 className="font-bold text-teal-900 text-base">{t('paymentTitle')}</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-[#1a3a3a]">
              <li>{t('step1', { app: 'MBWay' })}</li>
              <li>{t('step2')}</li>
              <li>
                {t('step3')}{' '}
                <strong className="text-teal-800 text-base tracking-widest">{mbwayPhone}</strong>
              </li>
              <li>
                {t('step4')}{' '}
                <strong className="text-teal-800 text-base">{formatCurrency(total)}</strong>
              </li>
              <li>
                {t('step5')}{' '}
                <strong className="text-teal-800">{t('step5ref', { dish: prato, name: nome })}</strong>
              </li>
              <li>{t('step6')}</li>
            </ol>
          </div>

          <p className="text-center text-sm text-[#1a3a3a]/50">{t('disclaimer')}</p>

          <div className="text-center">
            <Link
              href="/"
              className="inline-block bg-teal-700 hover:bg-teal-800 text-white font-bold px-6 py-3 rounded-xl transition-colors"
            >
              {t('back')}
            </Link>
          </div>
        </div>
      </main>

      <footer className="bg-teal-900 text-teal-200 py-4 px-4 text-center text-sm">
        <p>Pagamentos via MBWay para <strong className="text-white tracking-widest">{mbwayPhone}</strong></p>
      </footer>
    </div>
  );
}
