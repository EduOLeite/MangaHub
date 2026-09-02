'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import { ArrowLeft, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message === 'Invalid login credentials' 
        ? 'E-mail ou senha incorretos.' 
        : error.message);
      setLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <main className="min-h-screen bg-[#0f0f12] text-white flex flex-col items-center justify-center p-4">
      <Link href="/" className="absolute top-6 left-6 text-gray-400 hover:text-white flex items-center gap-2 transition">
        <ArrowLeft size={18} /> Voltar ao início
      </Link>

      <div className="w-full max-w-md bg-[#16161c] border border-gray-800 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black tracking-wider text-pink-500">
            MANGA<span className="text-white">HUB</span>
          </h1>
          <p className="text-gray-400 text-sm">Acesse sua conta para favoritar e comentar</p>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-lg text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-400 uppercase">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-500" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full bg-[#0f0f12] border border-gray-800 focus:border-pink-500 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none transition"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-400 uppercase">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-500" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0f0f12] border border-gray-800 focus:border-pink-500 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 mt-2"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400">
          Ainda não tem uma conta?{' '}
          <Link href="/register" className="text-pink-400 hover:underline font-semibold">
            Cadastre-se
          </Link>
        </p>
      </div>
    </main>
  );
}