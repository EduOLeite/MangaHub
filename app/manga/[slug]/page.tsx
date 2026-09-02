'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import Navbar from '@/app/components/Navbar';
import Link from 'next/link';
import { Play, Heart, Share2, BookOpen, Calendar, Search, LayoutGrid, List } from 'lucide-react';

export default function MangaDetailsPage() {
  const { slug } = useParams();
  const [manga, setManga] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (slug) fetchMangaDetails();
  }, [slug]);

  const fetchMangaDetails = async () => {
    try {
      // Busca o mangá pelo slug
      const { data: mangaData, error: mangaError } = await supabase
        .from('mangas')
        .select('*')
        .eq('slug', slug)
        .single();

      if (mangaError) throw mangaError;
      setManga(mangaData);

      if (mangaData) {
        // Busca os capítulos ordenados do mais recente para o mais antigo
        const { data: chaptersData } = await supabase
          .from('chapters')
          .select('*')
          .eq('manga_id', mangaData.id)
          .order('chapter_number', { ascending: false });

        setChapters(chaptersData || []);
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f12] text-white">
        <Navbar />
        <div className="flex justify-center items-center h-[80vh]">
          <p className="text-gray-400 animate-pulse">Carregando obra...</p>
        </div>
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="min-h-screen bg-[#0f0f12] text-white">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
          <p className="text-xl font-bold">Obra não encontrada.</p>
          <Link href="/" className="text-pink-500 hover:underline">Voltar para o início</Link>
        </div>
      </div>
    );
  }

  // Filtrar capítulos pela busca rápida
  const filteredChapters = chapters.filter((chap) => 
    chap.chapter_number.toString().includes(searchTerm) ||
    (chap.title && chap.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const firstChapter = chapters.length > 0 ? chapters[chapters.length - 1] : null;

  return (
    <div className="min-h-screen bg-[#0f0f12] text-white pb-16">
      <Navbar />

      {/* Banner de Fundo com Gradiente */}
      <div className="relative w-full h-80 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center filter blur-xl opacity-20 scale-110"
          style={{ backgroundImage: `url(${manga.banner_url || manga.cover_url})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f12] via-[#0f0f12]/60 to-transparent" />
      </div>

      <main className="max-w-7xl mx-auto px-4 -mt-48 relative z-10 space-y-8">
        
        {/* Bloco Principal da Obra */}
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Capa */}
          <div className="w-48 md:w-64 rounded-2xl overflow-hidden shadow-2xl border-4 border-gray-800/80 flex-shrink-0 bg-[#16161c] mx-auto md:mx-0">
            <img 
              src={manga.cover_url} 
              alt={manga.title} 
              className="w-full h-auto object-cover aspect-[3/4]"
            />
          </div>

          {/* Informações e Metadados */}
          <div className="flex-1 space-y-4 text-center md:text-left w-full">
            <div>
              <span className="inline-block bg-pink-600/20 border border-pink-500/40 text-pink-400 text-xs font-bold px-3 py-1 rounded-full uppercase mb-2">
                {manga.type}
              </span>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight">{manga.title}</h1>
            </div>

            <p className="text-gray-300 text-sm md:text-base leading-relaxed max-w-3xl">
              {manga.synopsis}
            </p>

            {/* Barra de Metadados (Estilo Print 2) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-[#16161c]/90 border border-gray-800 rounded-2xl p-4 text-sm backdrop-blur-md">
              <div>
                <span className="block text-xs text-gray-500 uppercase font-semibold">Status</span>
                <span className="font-bold text-gray-200">{manga.status || 'Em Andamento'}</span>
              </div>
              <div>
                <span className="block text-xs text-gray-500 uppercase font-semibold">Autor</span>
                <span className="font-bold text-gray-200 truncate block">{manga.author || 'Desconhecido'}</span>
              </div>
              <div>
                <span className="block text-xs text-gray-500 uppercase font-semibold">Artista</span>
                <span className="font-bold text-gray-200 truncate block">{manga.artist || 'Desconhecido'}</span>
              </div>
              <div>
                <span className="block text-xs text-gray-500 uppercase font-semibold">Ano</span>
                <span className="font-bold text-gray-200">{manga.release_year || '2026'}</span>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex flex-wrap gap-3 pt-2 justify-center md:justify-start">
              {firstChapter ? (
                <Link 
                  href={`/manga/${manga.slug}/capitulo/${firstChapter.chapter_number}`}
                  className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition flex items-center gap-2 text-sm"
                >
                  <Play size={18} fill="white" /> Iniciar Leitura
                </Link>
              ) : (
                <button disabled className="bg-gray-800 text-gray-500 font-bold px-6 py-3 rounded-xl cursor-not-allowed text-sm">
                  Sem Capítulos
                </button>
              )}

              <button className="bg-[#16161c] hover:bg-gray-800 border border-gray-800 text-gray-300 font-semibold px-5 py-3 rounded-xl transition flex items-center gap-2 text-sm">
                <Heart size={18} /> Favoritar
              </button>

              <button className="bg-[#16161c] hover:bg-gray-800 border border-gray-800 text-gray-300 font-semibold px-5 py-3 rounded-xl transition flex items-center gap-2 text-sm">
                <Share2 size={18} /> Compartilhar
              </button>
            </div>
          </div>
        </div>

        {/* Seção de Capítulos */}
        <div className="space-y-4 pt-6 border-t border-gray-800/60">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-xl font-black uppercase tracking-wide flex items-center gap-2">
              <BookOpen className="text-pink-500" size={22} /> Capítulos ({chapters.length})
            </h2>

            {/* Controles de Busca e Visualização */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input 
                  type="text"
                  placeholder="Buscar cap. (Ex: 1)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#16161c] border border-gray-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white outline-none focus:border-pink-500 transition"
                />
              </div>

              {/* Alternar Grade / Lista */}
              <div className="flex bg-[#16161c] border border-gray-800 rounded-xl p-1">
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition ${viewMode === 'list' ? 'bg-pink-600 text-white' : 'text-gray-400 hover:text-white'}`}
                  title="Modo Lista"
                >
                  <List size={16} />
                </button>
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-pink-600 text-white' : 'text-gray-400 hover:text-white'}`}
                  title="Modo Grade"
                >
                  <LayoutGrid size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Listagem de Capítulos */}
          {filteredChapters.length === 0 ? (
            <div className="bg-[#16161c] border border-gray-800 rounded-2xl p-8 text-center text-gray-500 text-sm">
              Nenhum capítulo encontrado.
            </div>
          ) : viewMode === 'grid' ? (
            // Layout em Grade (Estilo Print 2)
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredChapters.map((chap) => {
                const dateFormatted = new Date(chap.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                }).toUpperCase();

                return (
                  <Link 
                    key={chap.id}
                    href={`/manga/${manga.slug}/capitulo/${chap.chapter_number}`}
                    className="bg-[#16161c] hover:bg-[#1f1f28] border border-gray-800 hover:border-pink-500/50 rounded-2xl p-4 transition group flex flex-col justify-between space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-base text-white group-hover:text-pink-400 transition">
                        Cap. {chap.chapter_number}
                      </span>
                      <span className="text-[10px] font-bold bg-gray-800/80 text-gray-300 px-2.5 py-1 rounded-full uppercase tracking-wider">
                        {dateFormatted}
                      </span>
                    </div>

                    <p className="text-xs text-gray-400 truncate">
                      {chap.title || manga.title}
                    </p>

                    <div className="flex items-center gap-1.5 text-xs font-bold text-pink-500 pt-2 border-t border-gray-800/80">
                      <BookOpen size={14} /> Ler
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            // Layout em Lista Compacta Otimizada
            <div className="space-y-2">
              {filteredChapters.map((chap) => {
                const dateFormatted = new Date(chap.created_at).toLocaleDateString('pt-BR');
                return (
                  <Link 
                    key={chap.id}
                    href={`/manga/${manga.slug}/capitulo/${chap.chapter_number}`}
                    className="flex justify-between items-center bg-[#16161c] hover:bg-[#1f1f28] border border-gray-800 hover:border-pink-500/50 p-4 rounded-xl transition group"
                  >
                    <div className="flex items-center gap-3">
                      <BookOpen size={18} className="text-pink-500 group-hover:scale-110 transition" />
                      <div>
                        <span className="font-bold text-sm">Capítulo {chap.chapter_number}</span>
                        {chap.title && <span className="text-xs text-gray-400 ml-2">- {chap.title}</span>}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar size={14} /> {dateFormatted}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}