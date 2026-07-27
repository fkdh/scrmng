import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { readingHistory } from '@/lib/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';

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

  const history = await db.query.readingHistory.findFirst({
    where: and(
      eq(readingHistory.userId, user.id),
      eq(readingHistory.mangaId, mangaId)
    ),
  });

  return NextResponse.json({ history: history || null });
}

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

  try {
    const body = await req.json();
    const { chapterNumber, lastImage } = body;

    if (chapterNumber === undefined || lastImage === undefined) {
      return NextResponse.json({ error: 'chapterNumber and lastImage required' }, { status: 400 });
    }

    const existing = await db.query.readingHistory.findFirst({
      where: and(
        eq(readingHistory.userId, user.id),
        eq(readingHistory.mangaId, mangaId)
      ),
    });

    if (existing) {
      await db
        .update(readingHistory)
        .set({
          chapterNumber: chapterNumber.toString(),
          lastImage,
          updatedAt: new Date(),
        })
        .where(eq(readingHistory.id, existing.id));
    } else {
      await db.insert(readingHistory).values({
        userId: user.id,
        mangaId,
        chapterNumber: chapterNumber.toString(),
        lastImage,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving history:', error);
    return NextResponse.json({ error: 'Failed to save history' }, { status: 500 });
  }
}
