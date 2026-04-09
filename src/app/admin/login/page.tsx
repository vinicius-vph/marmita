'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push('/admin');
    } else {
      const data = await res.json();
      setError(data.error ?? 'Senha incorreta.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f7f7] px-4">
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
          <h1 className="text-xl font-bold text-[#1a3a3a]">Área de Gestão</h1>
          <p className="text-sm text-[#1a3a3a]/50">Marmita Solidária</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#1a3a3a] mb-1">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-700 hover:bg-teal-800 disabled:bg-teal-300 text-white font-bold py-2.5 rounded-xl transition-colors"
          >
            {loading ? 'A entrar...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/" className="text-xs text-[#1a3a3a]/40 hover:text-[#1a3a3a] underline">
            ← Voltar ao site
          </a>
        </div>
      </div>
    </div>
  );
}
