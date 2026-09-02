'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import Link from 'next/link';
import { ArrowLeft, ChevronLeft, ChevronRight, Home } from 'lucide-react';

export default function ReaderPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug;
  const chapterNumberStr = params.chapterNumber;

  const [manga, setManga] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [currentChapter, setCurrentChapter] = useState<any>(null);
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug && chapterNumberStr) {
      fetchReaderData();
    }
  }, [slug, chapterNumberStr]);

  const fetchReaderData = async () => {
    try {
      setLoading(true);
      // 1. Busca a obra
      const { data: mangaData, error: mangaErr } = await supabase
        .from('mangas')
        .select('*')
        .eq('slug', slug)
        .single();

      if (mangaErr) throw mangaErr;
      setManga(mangaData);

      // 2. Busca todos os capítulos da obra
      const { data: chaptersData, error: chapErr } = await supabase
        .from('chapters')
        .select('*')
        .eq('manga_id', mangaData.id)
        .order('chapter_number', { ascending: true });

      if (chapErr) throw chapErr;
      setChapters(chaptersData || []);

      // 3. Encontra o capítulo atual baseado no número da URL
      const targetChapter = chaptersData?.find(
        (c) => c.chapter_number.toString() === chapterNumberStr
      );

      if (!targetChapter) {
        throw new Error('Capítulo não encontrado');
      }

      setCurrentChapter(targetChapter);

      // 4. Busca as páginas do capítulo ordenadas
      const { data: pagesData, error: pagesErr } = await supabase
        .from('pages')
        .select('*')
        .eq('chapter_id', targetChapter.id)
        .order('page_number', { ascending: true });

      if (pagesErr) throw pagesErr;
      setPages(pagesData || []);

    } catch (err) {
      console.error('Erro no leitor:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f12] text-white flex justify-center items-center">
        <p className="animate-pulse text-gray-400">Carregando capítulo...</p>
      </div>
    );
  }

  if (!currentChapter) {
    return (
      <div className="min-h-screen bg-[#0f0f12] text-white flex flex-col justify-center items-center gap-4">
        <p className="text-xl font-bold">Capítulo não encontrado.</p>
        <Link href={`/manga/${slug}`} className="text-pink-500 hover:underline">Voltar para a obra</Link>
      </div>
    );
  }

  // Navegação entre capítulos
  const currentIndex = chapters.findIndex((c) => c.id === currentChapter.id);
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-[#0f0f12] text-white flex flex-col items-center">
      
      {/* Barra Superior Fixa do Leitor */}
      <header className="w-full bg-[#16161c]/95 border-b border-gray-800 p-4 sticky top-0 z-50 backdrop-blur-md flex justify-between items-center max-w-4xl mx-auto rounded-b-2xl">
        <Link 
          href={`/manga/${slug}`}
          className="flex items-center gap-2 text-sm text-gray-300 hover:text-pink-500 transition font-medium"
        >
          <ArrowLeft size={18} /> {manga?.title}
        </Link>

        <span className="text-sm font-bold text-pink-400">
          Cap. {currentChapter.chapter_number} {currentChapter.title ? `- ${currentChapter.title}` : ''}
        </span>

        <Link 
          href="/"
          className="p-2 bg-gray-800/60 hover:bg-gray-800 rounded-xl transition text-gray-300"
          title="Início"
        >
          <Home size={18} />
        </Link>
      </header>

      {/* Exibição das Páginas na Vertical */}
      <main className="w-full max-w-3xl flex flex-col items-center my-4 space-y-2 px-2">
        {pages.length === 0 ? (
          <p className="text-gray-500 mt-20">Nenhuma página cadastrada neste capítulo.</p>
        ) : (
          pages.map((page) => (
            <img 
              key={page.id}
              src={page.image_url}
              alt={`Página ${page.page_number}`}
              className="w-full h-auto object-contain rounded-lg shadow-md"
              loading="lazy"
            />
          ))
        )}
      </main>

      {/* Navegação Inferior (Próximo / Capítulo Anterior) */}
      <footer className="w-full max-w-xl p-6 flex justify-between items-center gap-4 my-8">
        <button
          onClick={() => prevChapter && router.push(`/manga/${slug}/capitulo/${prevChapter.chapter_number}`)}
          disabled={!prevChapter}
          className="flex-1 bg-[#16161c] hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed border border-gray-800 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition"
        >
          <ChevronLeft size={18} /> Anterior
        </button>

        <button
          onClick={() => nextChapter && router.push(`/manga/${slug}/capitulo/${nextChapter.chapter_number}`)}
          disabled={!nextChapter}
          className="flex-1 bg-pink-600 hover:bg-pink-700 disabled:opacity-30 disabled:cursor-not-allowed py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition"
        >
          Próximo <ChevronRight size={18} />
        </button>
      </footer>

    </div>
  );
}