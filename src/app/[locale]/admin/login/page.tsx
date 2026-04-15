'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const t = useTranslations('AdminLogin');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        window.location.href = '/admin';
        return;
      }

      setError(t('errorDefault'));
    } catch {
      setError(t('errorConnection'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <Image
            src="/logo.jpg"
            alt="Primeira Igreja Baptista de Vila Real"
            width={72}
            height={72}
            className="rounded-full border-2 border-teal-200 shadow mb-3"
            priority
          />
          <h1 className="text-xl font-bold text-foreground">{t('area')}</h1>
          <p className="text-sm text-foreground/50">{t('app')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
              {t('password')}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              required
              autoFocus
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 transition-colors ${
                error ? 'border-red-400 bg-red-50' : 'border-stone-300'
              }`}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2.5">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-700 hover:bg-teal-800 disabled:bg-teal-300 text-white font-bold py-2.5 rounded-xl transition-colors"
          >
            {loading ? t('checking') : t('enter')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/" className="text-xs text-foreground/40 hover:text-foreground underline">
            {t('back')}
          </a>
        </div>
      </div>
    </div>
  );
}
