'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="text-teal-400 hover:text-red-300 transition-colors text-sm disabled:opacity-50"
    >
      {loading ? '...' : 'Sair'}
    </button>
  );
}
