import Image from 'next/image';
import Link from 'next/link';
import Navbar from './components/Navbar';
import { supabase } from '@/app/lib/supabase';
import { Star, Eye, BookOpen } from 'lucide-react';

export const revalidate = 0;

export default async function Home() {
  const { data: mangas } = await supabase
    .from('mangas')
    .select('*')
    .order('created_at', { ascending: false });

  const featuredManga = mangas && mangas.length > 0 ? mangas[0] : null;

  return (
    <main className="min-h-screen bg-[#0f0f12] text-white">
      {/* Componente Navbar que tem Login, Sair e Painel Admin */}
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-10">
        {/* Destaque */}
        {featuredManga && (
          <section className="relative rounded-2xl overflow-hidden bg-[#16161c] border border-gray-800 p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center">
            <div className="relative w-48 h-64 md:w-56 md:h-80 rounded-xl overflow-hidden shrink-0 shadow-2xl border border-pink-500/30">
              <Image
                src={featuredManga.cover_url}
                alt={featuredManga.title}
                fill
                className="object-cover"
                priority
              />
            </div>

            <div className="space-y-4 text-center md:text-left flex-1">
              <span className="bg-pink-600/20 text-pink-400 text-xs font-bold px-3 py-1 rounded-full border border-pink-500/30 uppercase tracking-wider">
                Em Lançamento
              </span>
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight">
                {featuredManga.title}
              </h1>
              <p className="text-gray-400 text-sm md:text-base line-clamp-3 max-w-2xl">
                {featuredManga.synopsis}
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm font-semibold">
                <span className="flex items-center gap-1 text-yellow-400">
                  <Star size={16} fill="currentColor" /> {featuredManga.rating || '9.8'}
                </span>
                <span className="flex items-center gap-1 text-gray-400">
                  <Eye size={16} /> {featuredManga.views_count?.toLocaleString() || 0} views
                </span>
              </div>

              <div className="pt-2">
                <Link
                  href={`/manga/${featuredManga.slug}`}
                  className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white font-bold px-6 py-3 rounded-xl transition shadow-lg shadow-pink-600/30"
                >
                  <BookOpen size={18} /> LER AGORA
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Lista de Recentes */}
        <section className="space-y-4">
          <h2 className="text-xl font-extrabold uppercase tracking-wider border-l-4 border-pink-500 pl-3">
            Últimas Atualizações
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {mangas?.map((manga) => (
              <Link
                key={manga.id}
                href={`/manga/${manga.slug}`}
                className="group bg-[#16161c] rounded-xl overflow-hidden border border-gray-800/80 hover:border-pink-500/50 transition duration-300 flex flex-col"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden">
                  <Image
                    src={manga.cover_url}
                    alt={manga.title}
                    fill
                    className="object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-2 left-2 bg-black/70 backdrop-blur text-pink-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                    {manga.type || 'MANHUA'}
                  </div>
                </div>
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <h3 className="font-bold text-sm line-clamp-1 group-hover:text-pink-500 transition">
                    {manga.title}
                  </h3>
                  <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                    <span className="text-yellow-400 flex items-center gap-1 font-semibold">
                      <Star size={12} fill="currentColor" /> {manga.rating || '9.8'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}