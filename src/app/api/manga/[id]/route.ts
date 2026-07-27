import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { manga, chapters } from '@/lib/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { eq, desc } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.join(process.cwd(), 'output');

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

  const mangaRecord = await db.query.manga.findFirst({
    where: eq(manga.id, mangaId),
  });

  if (!mangaRecord) {
    return NextResponse.json({ error: 'Manga not found' }, { status: 404 });
  }

  const mangaChapters = await db
    .select()
    .from(chapters)
    .where(eq(chapters.mangaId, mangaId))
    .orderBy(desc(chapters.chapterNumber));

  return NextResponse.json({ manga: { ...mangaRecord, chapters: mangaChapters } });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const mangaId = parseInt(id, 10);

  if (isNaN(mangaId)) {
    return NextResponse.json({ error: 'Invalid manga ID' }, { status: 400 });
  }

  try {
    const mangaRecord = await db.query.manga.findFirst({
      where: eq(manga.id, mangaId),
    });

    if (mangaRecord) {
      const mangaDir = path.join(OUTPUT_DIR, mangaRecord.source, mangaRecord.slug);
      if (fs.existsSync(mangaDir)) {
        fs.rmSync(mangaDir, { recursive: true, force: true });
      }
    }

    await db.delete(manga).where(eq(manga.id, mangaId));
    return NextResponse.json({ message: 'Manga deleted' });
  } catch (error) {
    console.error('Error deleting manga:', error);
    return NextResponse.json({ error: 'Failed to delete manga' }, { status: 500 });
  }
}
