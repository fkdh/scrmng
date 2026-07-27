import { z } from 'zod';

export const chapterInputSchema = z.object({
  mangaId: z.number().int().positive(),
  chapterNumber: z.number().min(0, 'Chapter number minimal 0'),
  title: z.string().max(500).optional().nullable(),
  sourceUrl: z.string().url('URL tidak valid'),
  totalImages: z.number().int().min(0).optional().default(0),
  downloadedImages: z.number().int().min(0).optional().default(0),
  status: z.enum(['pending', 'downloading', 'completed', 'error']).optional().default('pending'),
  errorMessage: z.string().optional().nullable(),
});

export const chapterUpdateSchema = chapterInputSchema.partial().omit({ mangaId: true });

export type ChapterInput = z.infer<typeof chapterInputSchema>;
export type ChapterUpdate = z.infer<typeof chapterUpdateSchema>;
