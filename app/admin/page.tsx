'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import Navbar from '@/app/components/Navbar';
import { PlusCircle, Upload, BookOpen, Layers, Trash2 } from 'lucide-react';

export default function AdminPage() {
  const [mangas, setMangas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Campos do Mangá
  const [mangaTitle, setMangaTitle] = useState('');
  const [mangaSynopsis, setMangaSynopsis] = useState('');
  const [mangaType, setMangaType] = useState('MANHUA');
  const [mangaStatus, setMangaStatus] = useState('Em Andamento');
  const [mangaAuthor, setMangaAuthor] = useState('');
  const [mangaArtist, setMangaArtist] = useState('');
  const [mangaYear, setMangaYear] = useState('2026');
  const [coverFile, setCoverFile] = useState<File | null>(null);

  // Campos do Capítulo
  const [selectedMangaId, setSelectedMangaId] = useState('');
  const [chapterNumber, setChapterNumber] = useState('');
  const [chapterTitle, setChapterTitle] = useState('');
  const [pagesFiles, setPagesFiles] = useState<FileList | null>(null);

  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMangas();
  }, []);

  const fetchMangas = async () => {
    const { data } = await supabase.from('mangas').select('*').order('created_at', { ascending: false });
    if (data) setMangas(data);
    setLoading(false);
  };

  const uploadFile = async (file: File, bucketName: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const { error } = await supabase.storage.from(bucketName).upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from(bucketName).getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleCreateManga = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      let coverUrl = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500';
      if (coverFile) {
        coverUrl = await uploadFile(coverFile, 'mangas-covers');
      }

      const slug = mangaTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

      const { error } = await supabase.from('mangas').insert({
        title: mangaTitle,
        slug,
        synopsis: mangaSynopsis,
        type: mangaType,
        status: mangaStatus,
        author: mangaAuthor || 'Desconhecido',
        artist: mangaArtist || 'Desconhecido',
        release_year: parseInt(mangaYear) || 2026,
        cover_url: coverUrl,
        banner_url: coverUrl,
      });

      if (error) throw error;

      setMessage('✨ Mangá publicado com sucesso!');
      setMangaTitle('');
      setMangaSynopsis('');
      setMangaAuthor('');
      setMangaArtist('');
      setCoverFile(null);
      fetchMangas();
    } catch (err: any) {
      setMessage(`❌ Erro: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pagesFiles || pagesFiles.length === 0) return;

    setSubmitting(true);
    setMessage('');

    try {
      const { data: chapter, error: chapterError } = await supabase
        .from('chapters')
        .insert({
          manga_id: selectedMangaId,
          chapter_number: parseFloat(chapterNumber),
          title: chapterTitle || null,
        })
        .select()
        .single();

      if (chapterError) throw chapterError;

      const filesArray = Array.from(pagesFiles);
      for (let i = 0; i < filesArray.length; i++) {
        const pageUrl = await uploadFile(filesArray[i], 'mangas-pages');
        await supabase.from('pages').insert({
          chapter_id: chapter.id,
          page_number: i + 1,
          image_url: pageUrl,
        });
      }

      setMessage(`✨ Capítulo ${chapterNumber} publicado com sucesso!`);
      setChapterNumber('');
      setChapterTitle('');
      setPagesFiles(null);
    } catch (err: any) {
      setMessage(`❌ Erro: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteManga = async (id: string) => {
    if (!confirm('Deseja excluir este mangá e todos os capítulos?')) return;
    await supabase.from('mangas').delete().eq('id', id);
    fetchMangas();
  };

  return (
    <div className="min-h-screen bg-[#0f0f12] text-white">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
          <Layers className="text-pink-500" size={32} />
          <div>
            <h1 className="text-2xl font-black uppercase tracking-wider">Painel de Administração</h1>
            <p className="text-xs text-gray-400">Gerencie e publique obras e capítulos</p>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-xl text-sm font-semibold border ${
            message.includes('Erro') 
              ? 'bg-red-900/30 border-red-500/50 text-red-300' 
              : 'bg-pink-900/30 border-pink-500/50 text-pink-300'
          }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Mangá */}
          <section className="bg-[#16161c] border border-gray-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2 border-b border-gray-800 pb-3 text-pink-500">
              <PlusCircle size={20} /> Cadastrar Nova Obra
            </h2>

            <form onSubmit={handleCreateManga} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Título</label>
                <input
                  type="text"
                  required
                  value={mangaTitle}
                  onChange={(e) => setMangaTitle(e.target.value)}
                  className="w-full bg-[#0f0f12] border border-gray-800 rounded-lg p-2.5 outline-none focus:border-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Tipo</label>
                  <select
                    value={mangaType}
                    onChange={(e) => setMangaType(e.target.value)}
                    className="w-full bg-[#0f0f12] border border-gray-800 rounded-lg p-2.5 outline-none focus:border-pink-500"
                  >
                    <option value="MANHUA">MANHUA</option>
                    <option value="MANHWA">MANHWA</option>
                    <option value="MANGA">MANGÁ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Status</label>
                  <select
                    value={mangaStatus}
                    onChange={(e) => setMangaStatus(e.target.value)}
                    className="w-full bg-[#0f0f12] border border-gray-800 rounded-lg p-2.5 outline-none focus:border-pink-500"
                  >
                    <option value="Em Andamento">Em Andamento</option>
                    <option value="Completo">Completo</option>
                    <option value="Hiato">Hiato</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Autor</label>
                  <input
                    type="text"
                    placeholder="Ex: George Morikawa"
                    value={mangaAuthor}
                    onChange={(e) => setMangaAuthor(e.target.value)}
                    className="w-full bg-[#0f0f12] border border-gray-800 rounded-lg p-2.5 outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Artista</label>
                  <input
                    type="text"
                    placeholder="Ex: George Morikawa"
                    value={mangaArtist}
                    onChange={(e) => setMangaArtist(e.target.value)}
                    className="w-full bg-[#0f0f12] border border-gray-800 rounded-lg p-2.5 outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Ano de Lançamento</label>
                <input
                  type="number"
                  value={mangaYear}
                  onChange={(e) => setMangaYear(e.target.value)}
                  className="w-full bg-[#0f0f12] border border-gray-800 rounded-lg p-2.5 outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Sinopse</label>
                <textarea
                  rows={3}
                  required
                  value={mangaSynopsis}
                  onChange={(e) => setMangaSynopsis(e.target.value)}
                  className="w-full bg-[#0f0f12] border border-gray-800 rounded-lg p-2.5 outline-none resize-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Capa</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                  className="w-full bg-[#0f0f12] border border-gray-800 rounded-lg p-2 text-xs text-gray-400 focus:border-pink-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg transition"
              >
                {submitting ? 'Cadastrando...' : 'Cadastrar Obra'}
              </button>
            </form>
          </section>

          {/* Form Capítulo */}
          <section className="bg-[#16161c] border border-gray-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2 border-b border-gray-800 pb-3 text-pink-500">
              <BookOpen size={20} /> Publicar Capítulo
            </h2>

            <form onSubmit={handleCreateChapter} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Selecione o Mangá</label>
                <select
                  required
                  value={selectedMangaId}
                  onChange={(e) => setSelectedMangaId(e.target.value)}
                  className="w-full bg-[#0f0f12] border border-gray-800 rounded-lg p-2.5 outline-none focus:border-pink-500"
                >
                  <option value="">Selecione...</option>
                  {mangas.map((m) => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Número</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={chapterNumber}
                    onChange={(e) => setChapterNumber(e.target.value)}
                    className="w-full bg-[#0f0f12] border border-gray-800 rounded-lg p-2.5 outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Título (Opcional)</label>
                  <input
                    type="text"
                    value={chapterTitle}
                    onChange={(e) => setChapterTitle(e.target.value)}
                    className="w-full bg-[#0f0f12] border border-gray-800 rounded-lg p-2.5 outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Páginas</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  required
                  onChange={(e) => setPagesFiles(e.target.files)}
                  className="w-full bg-[#0f0f12] border border-gray-800 rounded-lg p-2 text-xs text-gray-400 focus:border-pink-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg transition flex items-center justify-center gap-2"
              >
                {submitting ? 'Enviando...' : (
                  <>
                    <Upload size={18} /> Publicar Capítulo
                  </>
                )}
              </button>
            </form>
          </section>
        </div>

        {/* Gerenciar Obras Existentes */}
        <section className="bg-[#16161c] border border-gray-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold border-b border-gray-800 pb-3 text-pink-500">
            Obras Cadastradas ({mangas.length})
          </h2>

          {loading ? (
            <p className="text-sm text-gray-500">Carregando obras...</p>
          ) : mangas.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhuma obra cadastrada ainda.</p>
          ) : (
            <div className="space-y-3">
              {mangas.map((manga) => (
                <div key={manga.id} className="flex justify-between items-center bg-[#0f0f12] p-4 rounded-xl border border-gray-800">
                  <div>
                    <h3 className="font-bold text-sm">{manga.title}</h3>
                    <span className="text-xs text-gray-500 uppercase">{manga.type} • {manga.status}</span>
                  </div>

                  <button
                    onClick={() => handleDeleteManga(manga.id)}
                    className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded-lg transition"
                    title="Excluir obra"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
} 