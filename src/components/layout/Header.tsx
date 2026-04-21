import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import LanguageSwitcher from '@/components/LanguageSwitcher';

interface Props {
  showTagline?: boolean;
  showLanguageSwitcher?: boolean;
}

export default async function Header({ showTagline = false, showLanguageSwitcher = false }: Props) {
  const t = await getTranslations('Home');

  return (
    <header className="bg-teal-800 text-white py-5 px-4 shadow-md">
      <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-4 hover:opacity-90 transition-opacity">
          <div className="shrink-0">
            <Image
              src="/logo.jpeg"
              alt="Primeira Igreja Baptista de Vila Real"
              width={showTagline ? 64 : 52}
              height={showTagline ? 64 : 52}
              className="rounded-full border-2 border-teal-300 shadow"
              priority
            />
          </div>
          <div>
            <h1 className={`${showTagline ? 'text-xl md:text-2xl' : 'text-xl'} font-bold tracking-tight leading-tight`}>
              {t('title')}
            </h1>
            <p className="text-teal-200 text-sm mt-0.5">{t('subtitle')}</p>
            {showTagline && (
              <p className="text-teal-300 text-xs mt-0.5">{t('tagline')}</p>
            )}
          </div>
        </Link>
        {showLanguageSwitcher && <LanguageSwitcher />}
      </div>
    </header>
  );
}
