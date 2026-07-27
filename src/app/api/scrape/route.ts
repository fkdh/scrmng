import { NextRequest, NextResponse } from 'next/server';
import { scrapeJobInputSchema } from '@/lib/schemas';
import { ZodError } from 'zod';
import { db } from '@/lib/db';
import { scrapeJobs, manga, chapters } from '@/lib/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { isSupported, getAdapter, getMangaUrl } from '@/lib/scrapers';
import { downloadImages } from '@/lib/scrapers/downloader';
import { eq, and } from 'drizzle-orm';
import path from 'path';
import fs from 'fs';

const OUTPUT_DIR = path.join(process.cwd(), 'output');

async function runScrapeJob(jobId: number) {
  // Get job from database
  const job = await db.select().from(scrapeJobs).where(eq(scrapeJobs.id, jobId)).then((rows) => rows[0]);

  if (!job) {
    throw new Error(`Job not found: ${jobId}`);
  }

  // Update job status to running
  await db.update(scrapeJobs).set({ status: 'running', updatedAt: new Date() }).where(eq(scrapeJobs.id, jobId));

  try {
    // Get adapter for this URL
    const adapter = getAdapter(job.sourceUrl);

    // Get or create manga
    let mangaRecord = await db
      .select()
      .from(manga)
      .where(and(eq(manga.source, adapter.name), eq(manga.sourceUrl, job.sourceUrl)))
      .then((rows) => rows[0]);

    if (!mangaRecord) {
      // Fetch manga info
      const mangaInfo = await adapter.fetchMangaInfo(job.sourceUrl);

      // Insert manga
      const [newManga] = await db
        .insert(manga)
        .values({
          source: mangaInfo.source,
          sourceUrl: mangaInfo.sourceUrl,
          title: mangaInfo.title,
          slug: mangaInfo.slug,
          thumbnail: mangaInfo.thumbnail,
          author: mangaInfo.author,
          status: mangaInfo.status,
          genres: mangaInfo.genres,
          synopsis: mangaInfo.synopsis,
          statusDl: 'downloading',
        })
        .returning();

      mangaRecord = newManga;

      // Update job with manga ID
      await db.update(scrapeJobs).set({ mangaId: mangaRecord.id }).where(eq(scrapeJobs.id, jobId));
    }

    // Get chapter list
    const allChapters = await adapter.fetchChapterList(job.sourceUrl);

    // Filter chapters by range
    const filteredChapters = allChapters.filter((ch) => {
      const num = ch.chapterNumber;
      const start = parseFloat(String(job.startChapter)) || 0;
      const end = parseFloat(String(job.endChapter)) || Infinity;
      return num >= start && num <= end;
    });

    // Update job total
    await db
      .update(scrapeJobs)
      .set({ total: filteredChapters.length, progress: 0 })
      .where(eq(scrapeJobs.id, jobId));

    let completedCount = 0;
    let totalImagesCount = 0;

    // Process each chapter
    for (const chapter of filteredChapters) {
      try {
        // Update current chapter
        await db
          .update(scrapeJobs)
          .set({ currentChapter: `Chapter ${chapter.chapterNumber}` })
          .where(eq(scrapeJobs.id, jobId));

        // Upsert chapter record
        let chapterRecord = await db
          .select()
          .from(chapters)
          .where(
            and(eq(chapters.mangaId, mangaRecord.id), eq(chapters.chapterNumber, String(chapter.chapterNumber)))
          )
          .then((rows) => rows[0]);

        if (!chapterRecord) {
          const [newChapter] = await db
            .insert(chapters)
            .values({
              mangaId: mangaRecord.id,
              chapterNumber: String(chapter.chapterNumber),
              title: chapter.title,
              sourceUrl: chapter.url,
              status: 'downloading',
            })
            .returning();
          chapterRecord = newChapter;
        } else {
          // Update status to downloading
          await db
            .update(chapters)
            .set({ status: 'downloading' })
            .where(eq(chapters.id, chapterRecord.id));
        }

        // Fetch chapter images
        const images = await adapter.fetchChapterImages(chapter.url);

        // Download images
        const destDir = path.join(OUTPUT_DIR, adapter.name, mangaRecord.slug, `chapter-${chapter.chapterNumber}`);

        const { completed } = await downloadImages(images, destDir, {
          onProgress: (dl, total) => {
            // Progress callback - could be used for SSE
          },
        });

        // Update chapter record
        await db
          .update(chapters)
          .set({
            totalImages: images.length,
            downloadedImages: completed,
            status: completed === images.length ? 'completed' : 'error',
            errorMessage: completed < images.length ? 'Some images failed to download' : null,
          })
          .where(eq(chapters.id, chapterRecord.id));

        totalImagesCount += images.length;

        completedCount++;

        // Update job progress
        await db
          .update(scrapeJobs)
          .set({ progress: completedCount })
          .where(eq(scrapeJobs.id, jobId));
      } catch (error) {
        console.error(`Error processing chapter ${chapter.chapterNumber}:`, (error as Error).message);

        // Update chapter status to error
        await db
          .update(chapters)
          .set({
            status: 'error',
            errorMessage: (error as Error).message,
          })
          .where(
            and(eq(chapters.mangaId, mangaRecord.id), eq(chapters.chapterNumber, String(chapter.chapterNumber)))
          );

        completedCount++;

        // Still update progress
        await db
          .update(scrapeJobs)
          .set({
            progress: completedCount,
            currentChapter: `Chapter ${chapter.chapterNumber} - Error`,
          })
          .where(eq(scrapeJobs.id, jobId));
      }
    }

    // Update manga totals
    await db
      .update(manga)
      .set({
        totalChapters: filteredChapters.length,
        totalImages: totalImagesCount,
        statusDl: 'completed',
        updatedAt: new Date(),
      })
      .where(eq(manga.id, mangaRecord.id));

    // Mark job as completed
    await db
      .update(scrapeJobs)
      .set({
        status: 'completed',
        currentChapter: null,
        updatedAt: new Date(),
      })
      .where(eq(scrapeJobs.id, jobId));

    return { success: true, jobId, totalProcessed: completedCount };
  } catch (error) {
    // Mark job as error
    await db
      .update(scrapeJobs)
      .set({
        status: 'error',
        errorMessage: (error as Error).message,
        updatedAt: new Date(),
      })
      .where(eq(scrapeJobs.id, jobId));

    throw error;
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = scrapeJobInputSchema.parse(body);

    // Check if URL is supported
    if (!isSupported(validated.url)) {
      return NextResponse.json({ error: 'Website belum didukung' }, { status: 400 });
    }

    const adapter = getAdapter(validated.url);
    const mangaUrl = validated.url;

    // Test fetch - verify URL is accessible
    try {
      await adapter.fetchHTML(mangaUrl);
    } catch {
      return NextResponse.json(
        { error: 'URL tidak dapat diakses. Pastikan URL valid dan situs dapat diakses.' },
        { status: 400 }
      );
    }

    // Create job
    const [job] = await db
      .insert(scrapeJobs)
      .values({
        source: adapter.name,
        sourceUrl: mangaUrl,
        startChapter: String(validated.startChapter),
        endChapter: String(validated.endChapter),
        status: 'queued',
      })
      .returning();

    // Start scraping in background (non-blocking)
    // In production, you'd use a proper job queue like Bull/BullMQ
    runScrapeJob(job.id).catch((error) => {
      console.error('Scrape job error:', error);
    });

    return NextResponse.json(
      {
        message: 'Scrape job started',
        job: {
          id: job.id,
          source: job.source,
          sourceUrl: job.sourceUrl,
          startChapter: job.startChapter,
          endChapter: job.endChapter,
          status: job.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Scrape error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
