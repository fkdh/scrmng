import { z } from 'zod';

export const mangaInputSchema = z.object({
  source: z.string().min(1, 'Source wajib diisi'),
  sourceUrl: z.string().url('URL tidak valid'),
  title: z.string().min(1, 'Judul wajib diisi').max(500),
  slug: z
    .string()
    .min(1)
    .max(500)
    .regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan strip'),
  thumbnail: z.string().url().optional().nullable(),
  author: z.string().max(500).optional().nullable(),
  status: z.string().max(100).optional().nullable(),
  genres: z.array(z.string()).optional().nullable(),
  synopsis: z.string().optional().nullable(),
});

export const mangaUpdateSchema = mangaInputSchema.partial();

export type MangaInput = z.infer<typeof mangaInputSchema>;
export type MangaUpdate = z.infer<typeof mangaUpdateSchema>;
