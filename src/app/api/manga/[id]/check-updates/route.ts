import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { manga, chapters } from '@/lib/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { getAdapter } from '@/lib/scrapers';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const mangaId = parseInt(id, 10);

  if (isNaN(mangaId)) {
    return NextResponse.json({ error: 'Invalid manga ID' }, { status: 400 });
  }

  const mangaRecord = await db.query.manga.findFirst({
    where: eq(manga.id, mangaId),
  });

  if (!mangaRecord) {
    return NextResponse.json({ error: 'Manga not found' }, { status: 404 });
  }

  try {
    const adapter = getAdapter(mangaRecord.sourceUrl);
    const sourceChapters = await adapter.fetchChapterList(mangaRecord.sourceUrl);

    const existingChapters = await db
      .select({ chapterNumber: chapters.chapterNumber })
      .from(chapters)
      .where(eq(chapters.mangaId, mangaId));

    const existingNumbers = new Set(
      existingChapters.map((ch) => parseFloat(ch.chapterNumber).toString())
    );

    const newChapters = sourceChapters.filter(
      (ch) => !existingNumbers.has(ch.chapterNumber.toString())
    );

    return NextResponse.json({
      totalSource: sourceChapters.length,
      totalExisting: existingChapters.length,
      newChapters: newChapters.map((ch) => ({
        chapterNumber: ch.chapterNumber,
        title: ch.title,
        url: ch.url,
        date: ch.date,
      })),
    });
  } catch (error) {
    console.error('Error checking updates:', error);
    return NextResponse.json({ error: 'Failed to check updates' }, { status: 500 });
  }
}
