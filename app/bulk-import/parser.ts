export interface ParsedPage {
  pageNumber: number;
  file: File;
}

export interface ParsedChapter {
  folderName: string;
  chapterNumber: number;
  chapterTitle: string | null;
  pages: ParsedPage[];
  status: 'ready' | 'exists' | 'error';
  errorMessage?: string;
}

export async function parseChapterFolder(dirHandle: any): Promise<ParsedChapter> {
  const folderName = dirHandle.name;
  const pages: ParsedPage[] = [];

  try {
    // Tenta extrair o número do capítulo do nome da pasta (ex: "Capitulo 001" ou "Capitulo 217" ou final da string)
    const matchChapter = folderName.match(/(?:Cap[ií]tulo|Cap\.?)\s*(\d+(?:\.\d+)?)/i);
    let chapterNumber = 0;

    if (matchChapter) {
      chapterNumber = parseFloat(matchChapter[1]);
    } else {
      // Fallback: pega o último número encontrado na string se não achar a palavra capítulo
      const numbers = folderName.match(/\d+/g);
      chapterNumber = numbers ? parseFloat(numbers[numbers.length - 1]) : 0;
    }

    // Extrai um título limpo se houver algo além do capítulo (opcional)
    let chapterTitle: string | null = null;

    // Varre os arquivos de imagem de dentro da pasta do capítulo
    for await (const [fileName, fileHandle] of dirHandle.entries()) {
      if (fileHandle.kind === 'file') {
        const file = await fileHandle.getFile();
        if (file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|avif)$/i.test(fileName)) {
          pages.push({ pageNumber: 0, file });
        }
      }
    }

    // Ordena as páginas alfabeticamente pelo nome do arquivo (ex: pagina_01.jpg, pagina_02.jpg)
    pages.sort((a, b) => a.file.name.localeCompare(b.file.name, undefined, { numeric: true }));

    // Reatribui o número sequencial correto da página (1, 2, 3...)
    pages.forEach((p, index) => {
      p.pageNumber = index + 1;
    });

    return {
      folderName,
      chapterNumber,
      chapterTitle,
      pages,
      status: pages.length > 0 ? 'ready' : 'error',
      errorMessage: pages.length === 0 ? 'Nenhuma imagem encontrada na pasta.' : undefined,
    };
  } catch (err: any) {
    return {
      folderName,
      chapterNumber: 0,
      chapterTitle: null,
      pages: [],
      status: 'error',
      errorMessage: err.message || 'Erro ao ler os arquivos.',
    };
  }
}