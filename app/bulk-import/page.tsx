'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import Navbar from '@/app/components/Navbar';
import Link from 'next/link';
import { FolderUp, ArrowLeft, Play, CheckCircle2, AlertTriangle, Layers, RefreshCw } from 'lucide-react';
import { parseChapterFolder, ParsedChapter } from './parser';

export default function BulkImportPage() {
  const [mangas, setMangas] = useState<any[]>([]);
  const [selectedMangaId, setSelectedMangaId] = useState('');
  
  const [analyzing, setAnalyzing] = useState(false);
  const [chapters, setChapters] = useState<ParsedChapter[]>([]);
  const [importing, setImporting] = useState(false);
  
  // Estados de Progresso
  const [progressStats, setProgressStats] = useState({
    totalChapters: 0,
    completedChapters: 0,
    totalImages: 0,
    uploadedImages: 0,
    failed: 0,
    skipped: 0,
  });

  useEffect(() => {
    fetchMangas();
  }, []);

  const fetchMangas = async () => {
    const { data } = await supabase.from('mangas').select('*').order('title', { ascending: true });
    if (data) setMangas(data);
  };

  // Função para selecionar a pasta raiz via API do navegador
  const handleSelectFolder = async () => {
    if (!selectedMangaId) {
      alert('Selecione uma obra primeiro!');
      return;
    }

    if (!(window as any).showDirectoryPicker) {
      alert('Seu navegador não suporta a seleção direta de pastas. Utilize o Google Chrome ou Edge atualizado.');
      return;
    }

    try {
      setAnalyzing(true);
      setChapters([]);

      // Abre o seletor de diretório do navegador
      const dirHandle = await (window as any).showDirectoryPicker();
      const parsedChapters: ParsedChapter[] = [];

      // Busca os capítulos já existentes no banco para evitar duplicidade
      const { data: existingChapters } = await supabase
        .from('chapters')
        .select('chapter_number')
        .eq('manga_id', selectedMangaId);

      const existingNumbers = new Set(existingChapters?.map((c) => c.chapter_number) || []);

      // Varre as subpastas da raiz selecionada
      for await (const [name, handle] of (dirHandle as any).entries()) {
        if (handle.kind === 'directory') {
          const chapterData = await parseChapterFolder(handle);

          // Verifica se o capítulo já existe no banco
          if (chapterData.status === 'ready' && existingNumbers.has(chapterData.chapterNumber)) {
            chapterData.status = 'exists';
            chapterData.errorMessage = 'Capítulo já cadastrado no sistema.';
          }

          parsedChapters.push(chapterData);
        }
      }

      // Ordena os capítulos por número
      parsedChapters.sort((a, b) => a.chapterNumber - b.chapterNumber);
      setChapters(parsedChapters);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Erro ao ler pastas:', err);
        alert(`Erro ao ler pastas: ${err.message}`);
      }
    } finally {
      setAnalyzing(false);
    }
  };

  // Função auxiliar de upload de arquivo individual para o Storage
  const uploadFileToStorage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const { error } = await supabase.storage.from('mangas-pages').upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from('mangas-pages').getPublicUrl(fileName);
    return data.publicUrl;
  };

  // Iniciar a Importação em Massa com Fila Controlada
  const startBulkImport = async () => {
    const readyChapters = chapters.filter((c) => c.status === 'ready');
    if (readyChapters.length === 0) {
      alert('Não há capítulos prontos para importar.');
      return;
    }

    if (!confirm(`Deseja iniciar a importação de ${readyChapters.length} capítulos?`)) return;

    setImporting(true);

    let totalImgsCount = readyChapters.reduce((acc, c) => acc + c.pages.length, 0);
    let uploadedImgsCount = 0;
    let completedChapCount = 0;
    let failedCount = 0;

    setProgressStats({
      totalChapters: readyChapters.length,
      completedChapters: 0,
      totalImages: totalImgsCount,
      uploadedImages: 0,
      failed: 0,
      skipped: chapters.filter((c) => c.status === 'exists' || c.status === 'error').length,
    });

    for (const chap of readyChapters) {
      try {
        // 1. Cria o capítulo no banco de dados
        const { data: dbChapter, error: chapError } = await supabase
          .from('chapters')
          .insert({
            manga_id: selectedMangaId,
            chapter_number: chap.chapterNumber,
            title: chap.chapterTitle,
          })
          .select()
          .single();

        if (chapError) throw chapError;

        // 2. Envia as páginas em lotes com concorrência controlada (ex: 3 uploads simultâneos por vez)
        const concurrencyLimit = 3;
        for (let i = 0; i < chap.pages.length; i += concurrencyLimit) {
          const batch = chap.pages.slice(i, i + concurrencyLimit);

          await Promise.all(
            batch.map(async (page) => {
              const imageUrl = await uploadFileToStorage(page.file);
              await supabase.from('pages').insert({
                chapter_id: dbChapter.id,
                page_number: page.pageNumber,
                image_url: imageUrl,
              });
              uploadedImgsCount++;
              setProgressStats((prev) => ({ ...prev, uploadedImages: uploadedImgsCount }));
            })
          );
        }

        completedChapCount++;
        setProgressStats((prev) => ({ ...prev, completedChapters: completedChapCount }));

        // Atualiza o status visual na lista
        setChapters((prev) =>
          prev.map((c) => (c.chapterNumber === chap.chapterNumber ? { ...c, status: 'exists' } : c))
        );
      } catch (err) {
        console.error(`Erro ao importar capítulo ${chap.chapterNumber}:`, err);
        failedCount++;
        setProgressStats((prev) => ({ ...prev, failed: failedCount }));
      }
    }

    setImporting(false);
    alert('✨ Importação em massa concluída com sucesso!');
  };

  const readyCount = chapters.filter((c) => c.status === 'ready').length;
  const existCount = chapters.filter((c) => c.status === 'exists').length;
  const totalPagesCount = chapters.reduce((acc, c) => acc + c.pages.length, 0);

  return (
    <div className="min-h-screen bg-[#0f0f12] text-white">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <div className="flex items-center gap-3">
            <Layers className="text-pink-500" size={32} />
            <div>
              <h1 className="text-2xl font-black uppercase tracking-wider">Importação em Massa de Capítulos</h1>
              <p className="text-xs text-gray-400">Selecione uma obra e a pasta raiz contendo as pastas dos capítulos</p>
            </div>
          </div>
          <Link
            href="/admin"
            className="bg-[#16161c] hover:bg-gray-800 border border-gray-800 text-gray-300 text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Voltar ao Painel
          </Link>
        </div>

        {/* Controles Iniciais */}
        <div className="bg-[#16161c] border border-gray-800 rounded-2xl p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">1. Selecione a Obra Destino</label>
              <select
                disabled={importing || analyzing}
                value={selectedMangaId}
                onChange={(e) => setSelectedMangaId(e.target.value)}
                className="w-full bg-[#0f0f12] border border-gray-800 rounded-xl p-3 text-sm outline-none focus:border-pink-500"
              >
                <option value="">Selecione uma obra...</option>
                {mangas.map((m) => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">2. Selecione a Pasta Raiz com os Capítulos</label>
              <button
                onClick={handleSelectFolder}
                disabled={!selectedMangaId || analyzing || importing}
                className="w-full bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-lg"
              >
                {analyzing ? (
                  <>
                    <RefreshCw className="animate-spin" size={18} /> Analisando arquivos...
                  </>
                ) : (
                  <>
                    <FolderUp size={18} /> Selecionar Pasta do Computador
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Resumo da Análise */}
        {chapters.length > 0 && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#16161c] border border-gray-800 p-4 rounded-2xl">
                <span className="text-xs text-gray-400 uppercase font-semibold">Capítulos Encontrados</span>
                <p className="text-2xl font-black text-white mt-1">{chapters.length}</p>
              </div>
              <div className="bg-[#16161c] border border-gray-800 p-4 rounded-2xl">
                <span className="text-xs text-gray-400 uppercase font-semibold">Prontos para Envio</span>
                <p className="text-2xl font-black text-pink-500 mt-1">{readyCount}</p>
              </div>
              <div className="bg-[#16161c] border border-gray-800 p-4 rounded-2xl">
                <span className="text-xs text-gray-400 uppercase font-semibold">Já Existentes (Ignorados)</span>
                <p className="text-2xl font-black text-yellow-500 mt-1">{existCount}</p>
              </div>
              <div className="bg-[#16161c] border border-gray-800 p-4 rounded-2xl">
                <span className="text-xs text-gray-400 uppercase font-semibold">Total de Páginas</span>
                <p className="text-2xl font-black text-purple-400 mt-1">{totalPagesCount}</p>
              </div>
            </div>

            {/* Botão de Disparo da Importação */}
            <div className="flex justify-end">
              <button
                onClick={startBulkImport}
                disabled={readyCount === 0 || importing}
                className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold px-8 py-4 rounded-2xl shadow-xl transition flex items-center gap-3 text-base"
              >
                {importing ? (
                  <>
                    <RefreshCw className="animate-spin" size={20} /> Importando Capítulos...
                  </>
                ) : (
                  <>
                    <Play size={20} fill="white" /> Iniciar Importação de {readyCount} Capítulos
                  </>
                )}
              </button>
            </div>

            {/* Barra de Progresso Durante o Envio */}
            {importing && (
              <div className="bg-[#16161c] border border-pink-500/40 rounded-2xl p-6 space-y-4 animate-pulse">
                <div className="flex justify-between text-sm font-bold">
                  <span>Enviando Capítulos ({progressStats.completedChapters} / {progressStats.totalChapters})</span>
                  <span>Imagens ({progressStats.uploadedImages} / {progressStats.totalImages})</span>
                </div>
                <div className="w-full bg-gray-800 h-3 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-pink-500 to-purple-500 h-full transition-all duration-300"
                    style={{ width: `${(progressStats.uploadedImages / (progressStats.totalImages || 1)) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Tabela de Prévia dos Capítulos */}
            <div className="bg-[#16161c] border border-gray-800 rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-bold border-b border-gray-800 pb-3 text-pink-500">
                Prévia dos Capítulos Identificados
              </h2>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {chapters.map((chap, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-[#0f0f12] p-3 rounded-xl border border-gray-800 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-pink-400">Cap. {chap.chapterNumber}</span>
                      <span className="text-gray-300 text-xs">{chap.chapterTitle}</span>
                      <span className="text-gray-500 text-xs">({chap.pages.length} páginas)</span>
                    </div>

                    <div>
                      {chap.status === 'ready' && (
                        <span className="flex items-center gap-1 text-xs font-bold text-green-400 bg-green-900/20 px-2.5 py-1 rounded-full border border-green-800/50">
                          <CheckCircle2 size={14} /> Pronto
                        </span>
                      )}
                      {chap.status === 'exists' && (
                        <span className="flex items-center gap-1 text-xs font-bold text-yellow-500 bg-yellow-900/20 px-2.5 py-1 rounded-full border border-yellow-800/50">
                          <CheckCircle2 size={14} /> Já existe
                        </span>
                      )}
                      {chap.status === 'error' && (
                        <span className="flex items-center gap-1 text-xs font-bold text-red-400 bg-red-900/20 px-2.5 py-1 rounded-full border border-red-800/50" title={chap.errorMessage}>
                          <AlertTriangle size={14} /> Erro
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}