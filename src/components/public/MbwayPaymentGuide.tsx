'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import PhoneMockup from './PhoneMockup';

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
        <PhoneMockup
          step={step}
          phone={phone}
          rawPhone={rawPhone}
          amount={amount}
          reference={reference}
          fadeClass={fadeClass}
        />

        <div className="flex-1 min-w-0 w-full sm:w-auto">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-teal-700 text-white text-xs font-bold px-2.5 py-0.5 rounded-full tabular-nums">
              {step + 1}&thinsp;/&thinsp;{TOTAL}
            </span>
          </div>

          <p className={`text-sm text-teal-900 leading-relaxed transition-opacity duration-200 ${fadeClass}`}>
            {stepText()}
          </p>

          <div className="flex items-center gap-2 mt-5">
            <button
              onClick={() => goTo((step - 1 + TOTAL) % TOTAL)}
              aria-label={t('previousStep')}
              className="w-7 h-7 flex items-center justify-center rounded-full text-teal-600 hover:bg-teal-100 hover:text-teal-900 transition-colors text-xl leading-none"
            >
              ‹
            </button>

            <div className="flex items-center gap-1.5">
              {Array.from({ length: TOTAL }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  aria-label={t('stepN', { n: i + 1 })}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === step ? 'bg-teal-700 w-5' : 'bg-teal-300 w-2 hover:bg-teal-500'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => goTo((step + 1) % TOTAL)}
              aria-label={t('nextStep')}
              className="w-7 h-7 flex items-center justify-center rounded-full text-teal-600 hover:bg-teal-100 hover:text-teal-900 transition-colors text-xl leading-none"
            >
              ›
            </button>
          </div>

          <p className="text-[11px] text-teal-500/50 mt-2">
            {paused ? '⏸' : '▶'} {paused ? t('paused') : t('autoAdvancing')}
          </p>
        </div>
      </div>
    </div>
  );
}
