'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import { User, LogOut, ShieldAlert } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUser(session.user);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
    router.refresh();
  };

  return (
    <header className="border-b border-gray-800 bg-[#16161c]/80 backdrop-blur sticky top-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-2xl font-black tracking-wider text-pink-500">
            MANGA<span className="text-white">HUB</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-gray-400">
            <Link href="/" className="hover:text-white transition">Início</Link>
            <Link href="#" className="hover:text-white transition">Populares</Link>
            <Link href="#" className="hover:text-white transition">Lançamentos</Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/admin"
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition"
              >
                <ShieldAlert size={16} />
                PAINEL ADMIN
              </Link>

              <div className="flex items-center gap-2 bg-gray-800/60 border border-gray-700/50 text-gray-200 text-xs font-semibold px-3 py-2 rounded-lg">
                <User size={16} className="text-pink-400" />
                <span>{user.email?.split('@')[0]}</span>
              </div>

              <button
                onClick={handleLogout}
                title="Sair"
                className="p-2 text-gray-400 hover:text-red-400 bg-gray-800/40 hover:bg-gray-800 rounded-lg transition"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition"
            >
              ENTRAR
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}