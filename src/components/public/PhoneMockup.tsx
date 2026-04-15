'use client';

import { useTranslations } from 'next-intl';
import QRCode from 'react-qr-code';

interface Props {
  step: number;
  phone: string;
  rawPhone: string;
  amount: string;
  reference: string;
  fadeClass: string;
}

export default function PhoneMockup({ step, phone, rawPhone, amount, reference, fadeClass }: Props) {
  const t = useTranslations('ThankYou');

  return (
    <div className="flex-shrink-0">
      <div className="relative w-[176px] bg-gray-900 rounded-[28px] p-[6px] shadow-2xl ring-1 ring-gray-700">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-5 bg-gray-900 rounded-b-2xl z-10" />

        <div className="bg-white rounded-[22px] overflow-hidden">
          <div className="bg-gray-50 px-3 pt-6 pb-0.5 flex justify-between">
            <span className="text-[8px] text-gray-400 font-semibold">9:41</span>
            <span className="text-[8px] text-gray-400">●●● 🔋</span>
          </div>

          <div className="bg-[#e4004a] px-3 py-2 flex items-center gap-2">
            <div className="w-4 h-4 bg-white rounded-sm flex items-center justify-center flex-shrink-0">
              <span className="text-[#e4004a] text-[7px] font-black leading-none">MB</span>
            </div>
            <span className="text-white font-bold text-xs tracking-wide">MB WAY</span>
          </div>

          <div className={`min-h-[164px] transition-opacity duration-200 ${fadeClass}`}>
            {step === 0 && (
              <div className="flex flex-col items-center justify-center py-8 gap-3 px-3">
                <div className="w-16 h-16 bg-[#e4004a] rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-black text-xl leading-none">MB</span>
                </div>
                <span className="text-[9px] text-gray-400 text-center">{t('tapToOpen')}</span>
              </div>
            )}

            {step === 1 && (
              <div className="px-2 py-2 space-y-0.5">
                {[
                  { icon: '💸', label: t('sendMoney'), active: true },
                  { icon: '📥', label: t('requestMoney'), active: false },
                  { icon: '📊', label: t('history'), active: false },
                  { icon: '⚙️', label: t('settings'), active: false },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${item.active ? 'bg-pink-50 border border-pink-200' : ''}`}
                  >
                    <span className="text-xs">{item.icon}</span>
                    <span className={`text-[10px] font-medium ${item.active ? 'text-[#e4004a]' : 'text-gray-400'}`}>
                      {item.label}
                    </span>
                    <span className="ml-auto text-[10px] text-gray-300">›</span>
                  </div>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="px-3 py-2 space-y-2">
                <p className="text-[8px] text-gray-400 font-semibold uppercase tracking-wide">{t('mbwayNumber')}</p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-center">
                  <span className="font-mono text-[9px] text-gray-700 tracking-wider">{phone}</span>
                </div>
                <div className="flex flex-col items-center gap-1 pt-0.5">
                  <div className="bg-white p-1.5 rounded-lg border border-gray-100 shadow-sm">
                    <QRCode value={rawPhone} size={72} />
                  </div>
                  <p className="text-[8px] text-teal-600/70">{t('qrCodeHint')}</p>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="px-3 py-3 space-y-2">
                <p className="text-[8px] text-gray-400 font-semibold uppercase tracking-wide">{t('amountToSend')}</p>
                <div className="bg-gray-50 border-2 border-[#e4004a]/30 rounded-xl px-3 py-4 text-center">
                  <span className="font-bold text-gray-800 text-base leading-none">{amount}</span>
                </div>
                <div className="bg-gray-100 rounded-lg h-6 opacity-40" />
                <div className="bg-gray-100 rounded-lg h-6 opacity-20" />
              </div>
            )}

            {step === 4 && (
              <div className="px-3 py-2 space-y-2">
                <p className="text-[8px] text-gray-400 font-semibold uppercase tracking-wide">{t('reference')}</p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 min-h-[90px]">
                  <span className="text-[9px] text-gray-700 leading-relaxed break-words">{reference}</span>
                  <span className="inline-block w-0.5 h-3 bg-[#e4004a] ml-0.5 animate-pulse align-middle" />
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="flex flex-col items-center justify-center py-8 gap-3 px-3">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center ring-4 ring-green-200">
                  <span className="text-2xl">✅</span>
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-bold text-green-700">{t('sent')}</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">{amount}</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-50 px-4 py-1.5 flex justify-around border-t border-gray-100">
            {['🏠', '📋', '👤'].map((icon) => (
              <span key={icon} className="text-sm opacity-30">{icon}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
