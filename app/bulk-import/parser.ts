export interface ParsedPage {
  fileName: string;
  file: File;
  pageNumber: number;
}

export interface ParsedChapter {
  chapterNumber: number;
  chapterTitle: string;
  folderName: string;
  pages: ParsedPage[];
  status: 'ready' | 'error' | 'exists';
  errorMessage?: string;
}

// Extrai o número do capítulo do nome da pasta (ex: "0001", "Capítulo 1500", "001 - O Retorno")
export function parseChapterNumber(folderName: string): { number: number | null; title: string } {
  // Tenta encontrar um número na string
  const cleanName = folderName.trim();
  
  // Regex para achar números (suporta decimais como 1500 ou 1.5, 10.1)
  const match = cleanName.match(/(?:cap|capitulo|vol|volume)?[\s_-]*(\d+(?:\.\d+)?)/i);
  
  if (!match) {
    return { number: null, title: cleanName };
  }

  const chapterNumber = parseFloat(match[1]);

  // Tenta extrair um título opcional se houver hífen ou texto após o número (ex: "1500 - O Último Combate")
  let title = cleanName;
  const parts = cleanName.split(/[-–—]/);
  if (parts.length > 1) {
    title = parts.slice(1).join('-').trim();
  }

  return { number: chapterNumber, title: title || `Capítulo ${chapterNumber}` };
}

// Ordena e filtra os arquivos de imagem corretamente (1, 2, 3 ... 10 e não 1, 10, 2)
export async function parseChapterFolder(dirHandle: FileSystemDirectoryHandle): Promise<ParsedChapter> {
  const { number: chapterNumber, title: chapterTitle } = parseChapterNumber(dirHandle.name);
  const pages: ParsedPage[] = [];

  if (chapterNumber === null) {
    return {
      chapterNumber: 0,
      chapterTitle: dirHandle.name,
      folderName: dirHandle.name,
      pages: [],
      status: 'error',
      errorMessage: 'Não foi possível identificar o número do capítulo no nome da pasta.'
    };
  }

  // Lê os arquivos de dentro da subpasta do capítulo
  for await (const [name, handle] of (dirHandle as any).entries()) {
    if (handle.kind === 'file') {
      const ext = name.split('.').pop()?.toLowerCase();
      if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
        const file: File = await handle.getFile();
        
        // Tenta extrair o número da página do nome do arquivo (ex: "001.jpg" -> 1)
        const pageMatch = name.match(/(\d+)/);
        const pageNumber = pageMatch ? parseInt(pageMatch[1], 10) : pages.length + 1;

        pages.push({
          fileName: name,
          file,
          pageNumber,
        });
      }
    }
  }

  if (pages.length === 0) {
    return {
      chapterNumber,
      chapterTitle,
      folderName: dirHandle.name,
      pages: [],
      status: 'error',
      errorMessage: 'Nenhuma imagem válida encontrada na pasta do capítulo.'
    };
  }

  // Ordena as páginas numericamente de forma estrita
  pages.sort((a, b) => a.pageNumber - b.pageNumber);

  return {
    chapterNumber,
    chapterTitle,
    folderName: dirHandle.name,
    pages,
    status: 'ready',
  };
}