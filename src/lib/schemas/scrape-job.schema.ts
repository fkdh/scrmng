import { z } from 'zod';

export const scrapeJobInputSchema = z
  .object({
    url: z.string().url('URL tidak valid'),
    startChapter: z.number().min(0, 'Chapter minimal 0'),
    endChapter: z.number().min(0, 'Chapter minimal 0'),
  })
  .refine((data) => data.endChapter >= data.startChapter, {
    message: 'Chapter akhir harus >= chapter awal',
    path: ['endChapter'],
  })
  .refine((data) => {
    const url = data.url.toLowerCase();
    if (!url.includes('komiku.org')) return false;
    return /komiku\.org\/manga\/[^/]+\/?$/.test(url);
  }, {
    message: 'Hanya format komiku.org/manga/judul yang didukung',
    path: ['url'],
  });

export const scrapeJobUpdateSchema = z.object({
  status: z.enum(['queued', 'running', 'completed', 'error']).optional(),
  progress: z.number().int().min(0).optional(),
  total: z.number().int().min(0).optional(),
  currentChapter: z.string().max(200).optional().nullable(),
  errorMessage: z.string().optional().nullable(),
  mangaId: z.number().int().positive().optional().nullable(),
});

export type ScrapeJobInput = z.infer<typeof scrapeJobInputSchema>;
export type ScrapeJobUpdate = z.infer<typeof scrapeJobUpdateSchema>;
