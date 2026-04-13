'use client';

import QRCode from 'react-qr-code';
import { useTranslations } from 'next-intl';

export default function MbwayQrCode({ phone }: { phone: string }) {
  const t = useTranslations('ThankYou');
  return (
    <div className="flex flex-col items-center gap-2 py-2">
      <div className="bg-white p-3 rounded-xl border border-teal-200 shadow-sm inline-block">
        <QRCode value={phone} size={140} />
      </div>
      <p className="text-xs text-teal-700/70">{t('qrCodeHint')}</p>
    </div>
  );
}
