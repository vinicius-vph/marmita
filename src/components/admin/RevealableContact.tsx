'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

const AUTO_HIDE_MS = 30_000;

interface Props {
  reservationId: string;
  maskedName: string;
  maskedPhone: string;
}

export default function RevealableContact({ reservationId, maskedName, maskedPhone }: Props) {
  const t = useTranslations('ReservationsTable');
  const [contact, setContact] = useState<{ name: string; phone: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!contact) return;
    const timer = setTimeout(() => setContact(null), AUTO_HIDE_MS);
    return () => clearTimeout(timer);
  }, [contact]);

  async function reveal() {
    setLoading(true);
    setFailed(false);
    try {
      const res = await fetch(`/api/reservations/${reservationId}/reveal`, {
        method: 'POST',
        headers: { Origin: window.location.origin },
      });
      if (!res.ok) throw new Error();
      setContact(await res.json());
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-w-0">
      <p className="font-semibold text-foreground break-words">{contact?.name ?? maskedName}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-sm text-foreground/60">{contact?.phone ?? maskedPhone}</p>
        <button
          type="button"
          onClick={contact ? () => setContact(null) : reveal}
          disabled={loading}
          className="text-xs text-teal-700 hover:text-teal-900 underline disabled:opacity-60"
        >
          <span aria-hidden="true">{contact ? '🙈' : '👁'}</span>{' '}
          {loading ? t('revealing') : contact ? t('hideContact') : t('showContact')}
        </button>
      </div>
      {failed && <p role="alert" className="text-xs text-red-600 mt-1">{t('revealError')}</p>}
    </div>
  );
}
