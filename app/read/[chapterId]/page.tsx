import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import { ArrowLeft, Home } from 'lucide-react';

export const revalidate = 0;

interface ReadPageProps {
  params: Promise<{ chapterId: string }>;
}

export default async function ReadChapterPage({ params }: ReadPageProps) {
  const { chapterId } = await params;

  // 1. Busca os detalhes do capítulo
  const { data: chapter } = await supabase
    .from('chapters')
    .select('*')
    .eq('id', chapterId)
    .single();

  if (!chapter) {
    notFound();
  }

  // 2. Busca a qual mangá esse capítulo pertence (para o botão de voltar)
  const { data: manga } = await supabase
    .from('mangas')
    .select('slug, title')
    .eq('id', chapter.manga_id)
    .single();

  // 3. Busca as páginas deste capítulo ordenadas pelo número da página
  const { data: pages } = await supabase
    .from('pages')
    .select('*')
    .eq('chapter_id', chapterId)
    .order('page_number', { ascending: true });

  return (
    <main className="min-h-screen bg-[#0a0a0c] text-white">
      {/* Barra de Navegação Superior (Fixa) */}
      <header className="border-b border-gray-800 bg-[#16161c]/95 backdrop-blur sticky top-0 z-50 px-4 py-3 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-4 flex-1">
          {manga && (
            <Link 
              href={`/manga/${manga.slug}`} 
              className="p-2 bg-gray-800/50 hover:bg-gray-700 rounded-lg transition text-gray-300 hover:text-white flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              <span className="hidden md:inline text-sm font-semibold truncate max-w-[200px]">
                {manga.title}
              </span>
            </Link>
          )}
        </div>
        
        <div className="flex-1 text-center">
          <h1 className="font-bold text-sm md:text-base truncate text-pink-500">
            Capítulo {chapter.chapter_number}
          </h1>
          {chapter.title && (
            <span className="text-xs text-gray-400 hidden sm:block truncate">
              {chapter.title}
            </span>
          )}
        </div>

        <div className="flex flex-1 justify-end">
          <Link href="/" className="p-2 hover:bg-gray-800 rounded-lg transition text-gray-400 hover:text-white">
            <Home size={20} />
          </Link>
        </div>
      </header>

      {/* Container de Leitura (Páginas) */}
      <div className="max-w-3xl mx-auto flex flex-col items-center bg-black min-h-screen shadow-2xl shadow-black/50">
        {pages && pages.length > 0 ? (
          pages.map((page) => (
            <div key={page.id} className="w-full flex justify-center">
              <Image
                src={page.image_url}
                alt={`Página ${page.page_number}`}
                width={800}
                height={1200}
                className="w-full h-auto object-contain"
                priority={page.page_number <= 2} // Carrega as duas primeiras páginas mais rápido
              />
            </div>
          ))
        ) : (
          <div className="p-10 text-gray-500 text-center mt-20 flex flex-col items-center gap-2">
            <span className="text-4xl">📭</span>
            <p>Nenhuma página encontrada para este capítulo.</p>
          </div>
        )}
      </div>

      {/* Rodapé do Leitor */}
      {pages && pages.length > 0 && (
        <footer className="py-12 text-center border-t border-gray-900 mt-8 bg-[#0a0a0c]">
          <p className="text-gray-500 text-sm mb-6 uppercase tracking-widest font-bold">
            Fim do Capítulo {chapter.chapter_number}
          </p>
          {manga && (
            <Link 
              href={`/manga/${manga.slug}`} 
              className="bg-pink-600 hover:bg-pink-700 text-white font-bold px-8 py-3 rounded-xl inline-flex items-center gap-2 transition hover:scale-105 active:scale-95 shadow-lg shadow-pink-600/20"
            >
              <ArrowLeft size={18} /> Voltar para os Capítulos
            </Link>
          )}
        </footer>
      )}
    </main>
  );
}