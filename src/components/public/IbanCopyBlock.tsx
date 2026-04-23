'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';

interface Props {
  iban: string;
  amount: string;
  title: string;
  note: string;
  totalLabel: string;
}

export default function IbanCopyBlock({ iban, amount, title, note, totalLabel }: Props) {
  const t = useTranslations('ThankYou');
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function copyIban() {
    navigator.clipboard.writeText(iban).then(() => {
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
      <p className="font-semibold text-blue-800">{title}</p>
      <p className="text-sm text-blue-700">{note}</p>

      {iban && (
        <div className="bg-white rounded-lg px-3 py-2 text-sm flex items-center justify-between gap-2">
          <div>
            <span className="text-blue-700/60 mr-2">{t('bankIban')}:</span>
            <span className="font-mono font-semibold text-blue-900">{iban}</span>
          </div>
          <button
            onClick={copyIban}
            className="flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:text-blue-900 border border-blue-200 hover:border-blue-400 rounded-lg px-2.5 py-1 transition-colors bg-white shrink-0"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="2,9 6,13 14,4"/></svg>
                {t('copied')}
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="5" width="9" height="9" rx="1.5"/><path d="M11 5V3a1.5 1.5 0 0 0-1.5-1.5H3A1.5 1.5 0 0 0 1.5 3v6.5A1.5 1.5 0 0 0 3 11h2"/></svg>
                {t('copyNumber')}
              </>
            )}
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg px-3 py-2 text-sm">
        <span className="text-blue-700/60 mr-2">{totalLabel}:</span>
        <span className="font-bold text-blue-900">{amount}</span>
      </div>
    </div>
  );
}
