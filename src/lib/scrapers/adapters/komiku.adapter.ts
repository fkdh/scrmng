import axios from 'axios';
import * as cheerio from 'cheerio';
import { BaseAdapter } from '../base-adapter';

export class KomikuAdapter extends BaseAdapter {
  static DOMAIN_PATTERN = 'komiku.org';
  static BASE_URL = 'https://komiku.org';

  get name() {
    return 'komiku';
  }

  static match(url: string): boolean {
    return /komiku\.org\/manga\/[^/]+\/?$/.test(url);
  }

  async fetchHTML(url: string): Promise<string> {
    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      timeout: 30000,
    });
    return response.data;
  }

  toMangaUrl(url: string): string {
    const match = url.match(/\/([^/]+)-chapter-\d+\/?$/);
    if (match) {
      return `${KomikuAdapter.BASE_URL}/manga/${match[1]}/`;
    }
    return url;
  }

  async fetchMangaInfo(mangaUrl: string) {
    const mangaUrlResolved = this.toMangaUrl(mangaUrl);
    const html = await this.fetchHTML(mangaUrlResolved);
    const $ = cheerio.load(html);

    // Get title
    const title = $('h1').first().text().trim().replace(/^Komik\s+/i, '');

    // Get slug from URL
    const slug = this.extractSlug(mangaUrlResolved);

    // Get thumbnail
    const thumbnail = $('meta[property="og:image"]').attr('content') || null;

    // Get author
    const author = $('td:contains("Author:")').next('td').text().trim() || null;

    // Get status
    const status = $('td:contains("Status:")').next('td').text().trim() || null;

    // Get genres
    const genres: string[] = [];
    $('ul.genre li a span').each((_, el) => {
      const genre = $(el).text().trim();
      if (genre) genres.push(genre);
    });

    // Get synopsis
    const synopsis = $('p.desc').text().trim() || $('meta[property="og:description"]').attr('content') || null;

    return {
      source: 'komiku',
      sourceUrl: mangaUrlResolved,
      title,
      slug,
      thumbnail,
      author,
      status,
      genres: genres.length > 0 ? genres : null,
      synopsis,
    };
  }

  async fetchChapterList(mangaUrl: string) {
    const html = await this.fetchHTML(this.toMangaUrl(mangaUrl));
    const $ = cheerio.load(html);
    const chapters: Array<{
      chapterNumber: number;
      title: string;
      url: string;
      date: string;
    }> = [];

    // Parse chapter list from table
    $('#daftarChapter tr').each((_, row) => {
      const link = $(row).find('td.judulseries a');
      const dateCell = $(row).find('td.tanggalseries');

      if (link.length) {
        const href = link.attr('href');
        const titleText = link.find('span b').text().trim() || link.text().trim();
        const date = dateCell.text().trim();

        // Extract chapter number from title
        const chapterMatch = titleText.match(/Chapter\s+([\d.]+)/i);
        if (chapterMatch && href) {
          chapters.push({
            chapterNumber: parseFloat(chapterMatch[1]),
            title: titleText,
            url: href.startsWith('http') ? href : `${KomikuAdapter.BASE_URL}${href}`,
            date,
          });
        }
      }
    });

    // Sort by chapter number descending (newest first)
    chapters.sort((a, b) => b.chapterNumber - a.chapterNumber);

    return chapters;
  }

  async fetchChapterImages(chapterUrl: string) {
    const html = await this.fetchHTML(chapterUrl);
    const $ = cheerio.load(html);
    const images: Array<{ index: number; url: string; filename: string }> = [];

    // Get images from #Baca_Komik
    $('#Baca_Komik img').each((index, el) => {
      const src = $(el).attr('src');
      if (src && !src.includes('lazy.jpg') && !src.includes('Loading.gif')) {
        const filename = `${index + 1}.jpg`;
        images.push({
          index: index + 1,
          url: src,
          filename,
        });
      }
    });

    return images;
  }

  buildChapterUrl(slug: string, chapterNumber: number): string {
    return `${KomikuAdapter.BASE_URL}/${slug}-chapter-${chapterNumber}/`;
  }

  extractSlug(url: string): string {
    // Extract slug from URL like https://komiku.org/manga/komik-one-piece-indo/
    const match = url.match(/\/manga\/([^/]+)\/?$/);
    if (match) return match[1];

    // Or from chapter URL like https://komiku.org/one-piece-chapter-1189/
    const chapterMatch = url.match(/\/([^/]+)-chapter-\d+/);
    if (chapterMatch) return chapterMatch[1];

    // Fallback: get last part of URL
    const parts = url.split('/').filter(Boolean);
    return parts[parts.length - 1] || 'unknown';
  }
}
