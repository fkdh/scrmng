import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { readingHistory, manga, chapters } from '@/lib/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { eq, and, desc } from 'drizzle-orm';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const historyWithManga = await db
    .select({
      id: readingHistory.id,
      mangaId: readingHistory.mangaId,
      chapterNumber: readingHistory.chapterNumber,
      lastImage: readingHistory.lastImage,
      updatedAt: readingHistory.updatedAt,
      mangaTitle: manga.title,
      mangaSlug: manga.slug,
      mangaSource: manga.source,
      mangaThumbnail: manga.thumbnail,
      totalImages: chapters.totalImages,
    })
    .from(readingHistory)
    .innerJoin(manga, eq(readingHistory.mangaId, manga.id))
    .leftJoin(
      chapters,
      and(
        eq(readingHistory.mangaId, chapters.mangaId),
        eq(readingHistory.chapterNumber, chapters.chapterNumber)
      )
    )
    .where(eq(readingHistory.userId, user.id))
    .orderBy(desc(readingHistory.updatedAt));

  return NextResponse.json({ history: historyWithManga });
}
