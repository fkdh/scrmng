import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { manga } from '@/lib/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { desc, like, eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const source = searchParams.get('source') || '';
  const status = searchParams.get('status') || '';

  let query = db.select().from(manga);

  if (search) {
    query = query.where(like(manga.title, `%${search}%`)) as typeof query;
  }

  if (source) {
    query = query.where(eq(manga.source, source)) as typeof query;
  }

  if (status) {
    query = query.where(eq(manga.statusDl, status)) as typeof query;
  }

  const mangaList = await query.orderBy(desc(manga.createdAt));

  return NextResponse.json({ manga: mangaList });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    // TODO: Validate with Zod schema
    const [newManga] = await db.insert(manga).values(body).returning();

    return NextResponse.json({ manga: newManga }, { status: 201 });
  } catch (error) {
    console.error('Error creating manga:', error);
    return NextResponse.json({ error: 'Failed to create manga' }, { status: 500 });
  }
}
