import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chapters, manga } from '@/lib/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(
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

  const chapterList = await db.query.chapters.findMany({
    where: eq(chapters.mangaId, mangaId),
    orderBy: [desc(chapters.chapterNumber)],
  });

  return NextResponse.json({ chapters: chapterList });
}
