'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import QRCode from 'react-qr-code';

interface Props {
  phone: string;
  rawPhone: string;
  amount: string;
  reference: string;
}

const TOTAL = 6;
const DELAY_MS = 3500;

export default function MbwayPaymentGuide({ phone, rawPhone, amount, reference }: Props) {
  const t = useTranslations('ThankYou');
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);

  const goTo = useCallback((next: number) => {
    setVisible(false);
    setTimeout(() => {
      setStep(next);
      setVisible(true);
    }, 180);
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = setTimeout(() => goTo((step + 1) % TOTAL), DELAY_MS);
    return () => clearTimeout(id);
  }, [paused, step, goTo]);

  const fadeClass = visible ? 'opacity-100' : 'opacity-0';

  const stepText = () => {
    switch (step) {
      case 0: return <>{t('step1')}</>;
      case 1: return <>{t('step2')}</>;
      case 2: return <>{t('step3')} <strong className="text-teal-800 tracking-widest">{phone}</strong></>;
      case 3: return <>{t('step4')} <strong className="text-teal-800">{amount}</strong></>;
      case 4: return <>{t('step5')} <strong className="text-teal-800 break-words">{reference}</strong></>;
      default: return <>{t('step6')}</>;
    }
  };

  return (
    <div
      className="bg-teal-50 border border-teal-200 rounded-xl p-5 select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <h3 className="font-bold text-teal-900 text-base mb-5 text-center">{t('paymentTitle')}</h3>

      <div className="flex flex-col sm:flex-row items-center gap-6">

        {/* ── Phone mockup ── */}
        <div className="flex-shrink-0">
          <div className="relative w-[176px] bg-gray-900 rounded-[28px] p-[6px] shadow-2xl ring-1 ring-gray-700">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-5 bg-gray-900 rounded-b-2xl z-10" />

            {/* Screen */}
            <div className="bg-white rounded-[22px] overflow-hidden">

              {/* Status bar */}
              <div className="bg-gray-50 px-3 pt-6 pb-0.5 flex justify-between">
                <span className="text-[8px] text-gray-400 font-semibold">9:41</span>
                <span className="text-[8px] text-gray-400">●●● 🔋</span>
              </div>

              {/* App bar */}
              <div className="bg-[#e4004a] px-3 py-2 flex items-center gap-2">
                <div className="w-4 h-4 bg-white rounded-sm flex items-center justify-center flex-shrink-0">
                  <span className="text-[#e4004a] text-[7px] font-black leading-none">MB</span>
                </div>
                <span className="text-white font-bold text-xs tracking-wide">MB WAY</span>
              </div>

              {/* Step content */}
              <div className={`min-h-[164px] transition-opacity duration-200 ${fadeClass}`}>

                {/* Step 0 — Open app */}
                {step === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 gap-3 px-3">
                    <div className="w-16 h-16 bg-[#e4004a] rounded-2xl flex items-center justify-center shadow-lg">
                      <span className="text-white font-black text-xl leading-none">MB</span>
                    </div>
                    <span className="text-[9px] text-gray-400 text-center">Toque para abrir</span>
                  </div>
                )}

                {/* Step 1 — Send Money menu */}
                {step === 1 && (
                  <div className="px-2 py-2 space-y-0.5">
                    {[
                      { icon: '💸', label: 'Enviar Dinheiro', active: true },
                      { icon: '📥', label: 'Pedir Dinheiro', active: false },
                      { icon: '📊', label: 'Histórico', active: false },
                      { icon: '⚙️', label: 'Definições', active: false },
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

                {/* Step 2 — Enter phone number */}
                {step === 2 && (
                  <div className="px-3 py-2 space-y-2">
                    <p className="text-[8px] text-gray-400 font-semibold uppercase tracking-wide">Número MBWay</p>
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

                {/* Step 3 — Enter amount */}
                {step === 3 && (
                  <div className="px-3 py-3 space-y-2">
                    <p className="text-[8px] text-gray-400 font-semibold uppercase tracking-wide">Valor a enviar</p>
                    <div className="bg-gray-50 border-2 border-[#e4004a]/30 rounded-xl px-3 py-4 text-center">
                      <span className="font-bold text-gray-800 text-base leading-none">{amount}</span>
                    </div>
                    <div className="bg-gray-100 rounded-lg h-6 opacity-40" />
                    <div className="bg-gray-100 rounded-lg h-6 opacity-20" />
                  </div>
                )}

                {/* Step 4 — Reference */}
                {step === 4 && (
                  <div className="px-3 py-2 space-y-2">
                    <p className="text-[8px] text-gray-400 font-semibold uppercase tracking-wide">Referência</p>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 min-h-[90px]">
                      <span className="text-[9px] text-gray-700 leading-relaxed break-words">{reference}</span>
                      <span className="inline-block w-0.5 h-3 bg-[#e4004a] ml-0.5 animate-pulse align-middle" />
                    </div>
                  </div>
                )}

                {/* Step 5 — Confirm */}
                {step === 5 && (
                  <div className="flex flex-col items-center justify-center py-8 gap-3 px-3">
                    <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center ring-4 ring-green-200">
                      <span className="text-2xl">✅</span>
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] font-bold text-green-700">Enviado!</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">{amount}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom nav bar */}
              <div className="bg-gray-50 px-4 py-1.5 flex justify-around border-t border-gray-100">
                {['🏠', '📋', '👤'].map((icon) => (
                  <span key={icon} className="text-sm opacity-30">{icon}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Step description + navigation ── */}
        <div className="flex-1 min-w-0 w-full sm:w-auto">

          {/* Step badge */}
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-teal-700 text-white text-xs font-bold px-2.5 py-0.5 rounded-full tabular-nums">
              {step + 1}&thinsp;/&thinsp;{TOTAL}
            </span>
          </div>

          {/* Instruction text */}
          <p className={`text-sm text-[#1a3a3a] leading-relaxed transition-opacity duration-200 ${fadeClass}`}>
            {stepText()}
          </p>

          {/* Dot + arrow navigation */}
          <div className="flex items-center gap-2 mt-5">
            <button
              onClick={() => goTo((step - 1 + TOTAL) % TOTAL)}
              aria-label="Passo anterior"
              className="w-7 h-7 flex items-center justify-center rounded-full text-teal-600 hover:bg-teal-100 hover:text-teal-900 transition-colors text-xl leading-none"
            >
              ‹
            </button>

            <div className="flex items-center gap-1.5">
              {Array.from({ length: TOTAL }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  aria-label={`Passo ${i + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === step ? 'bg-teal-700 w-5' : 'bg-teal-300 w-2 hover:bg-teal-500'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => goTo((step + 1) % TOTAL)}
              aria-label="Próximo passo"
              className="w-7 h-7 flex items-center justify-center rounded-full text-teal-600 hover:bg-teal-100 hover:text-teal-900 transition-colors text-xl leading-none"
            >
              ›
            </button>
          </div>

          <p className="text-[11px] text-teal-500/50 mt-2">
            {paused ? '⏸' : '▶'} {paused ? 'Pausado' : 'A avançar automaticamente'}
          </p>
        </div>
      </div>
    </div>
  );
}
