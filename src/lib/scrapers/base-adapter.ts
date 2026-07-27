/**
 * BaseAdapter - Abstract base class for website adapters
 * Every website adapter must extend this class and implement all methods.
 */
export class BaseAdapter {
  /** Adapter name, e.g., "komiku" */
  get name(): string {
    throw new Error('Not implemented: name getter');
  }

  /** Check if this adapter handles the given URL */
  static match(_url: string): boolean {
    throw new Error('Not implemented: match()');
  }

  /** Fetch manga info from series page */
  async fetchMangaInfo(_mangaUrl: string): Promise<{
    source: string;
    sourceUrl: string;
    title: string;
    slug: string;
    thumbnail: string | null;
    author: string | null;
    status: string | null;
    genres: string[] | null;
    synopsis: string | null;
  }> {
    throw new Error('Not implemented: fetchMangaInfo()');
  }

  /** Fetch chapter list from series page */
  async fetchChapterList(_mangaUrl: string): Promise<
    Array<{
      chapterNumber: number;
      title: string;
      url: string;
      date: string;
    }>
  > {
    throw new Error('Not implemented: fetchChapterList()');
  }

  /** Fetch image URLs from chapter page */
  async fetchChapterImages(_chapterUrl: string): Promise<
    Array<{
      index: number;
      url: string;
      filename: string;
    }>
  > {
    throw new Error('Not implemented: fetchChapterImages()');
  }

  /** Build chapter URL from manga slug and chapter number */
  buildChapterUrl(_slug: string, _chapterNumber: number): string {
    throw new Error('Not implemented: buildChapterUrl()');
  }

  /** Extract slug from manga URL */
  extractSlug(_url: string): string {
    throw new Error('Not implemented: extractSlug()');
  }
}
