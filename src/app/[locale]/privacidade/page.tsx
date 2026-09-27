import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { whatsappUrl } from '@/lib/utils';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { env } from '@/env';

const SECTIONS = [
  'controller',
  'data',
  'purpose',
  'legalBasis',
  'security',
  'retention',
  'sharing',
  'cookies',
  'rights',
] as const;

export default async function PrivacyPage() {
  const t = await getTranslations('Privacy');
  const waPhone = env.WHATSAPP_PHONE || env.MBWAY_PHONE;
  const waUrl = whatsappUrl(waPhone);

  return (
    <div className="min-h-screen flex flex-col">
      <Header showLanguageSwitcher />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10">
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 md:p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-teal-900">{t('title')}</h2>
            <p className="text-sm text-teal-900/50 mt-1">{t('updatedAt')}</p>
          </div>

          <p className="text-sm text-foreground/80">{t('intro')}</p>

          {SECTIONS.map((key) => (
            <div key={key}>
              <h3 className="font-semibold text-teal-900 mb-1">{t(`${key}Title`)}</h3>
              <p className="text-sm text-foreground/70">{t(`${key}Text`)}</p>
            </div>
          ))}

          <p className="text-sm text-foreground/70">
            {t('contactPrefix')}{' '}
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-700 underline font-medium"
            >
              WhatsApp
            </a>
            .
          </p>

          <div className="text-center pt-2">
            <Link
              href="/"
              className="inline-block bg-teal-700 hover:bg-teal-800 text-white font-bold px-6 py-3 rounded-xl transition-colors"
            >
              {t('back')}
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
