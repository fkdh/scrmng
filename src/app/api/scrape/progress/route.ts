import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { scrapeJobs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return new Response(JSON.stringify({ error: 'Job ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Set SSE headers
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let lastStatus = '';

      const sendEvent = (data: Record<string, unknown>) => {
        const event = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(event));
      };

      // Poll database for job status
      const interval = setInterval(async () => {
        try {
          const job = await db.query.scrapeJobs.findFirst({
            where: eq(scrapeJobs.id, parseInt(jobId, 10)),
          });

          if (!job) {
            sendEvent({ error: 'Job not found' });
            clearInterval(interval);
            controller.close();
            return;
          }

          const statusData = {
            jobId: job.id,
            status: job.status,
            progress: job.progress,
            total: job.total,
            currentChapter: job.currentChapter,
            errorMessage: job.errorMessage,
          };

          // Only send if status changed or progress updated
          const statusKey = JSON.stringify(statusData);
          if (statusKey !== lastStatus) {
            sendEvent(statusData);
            lastStatus = statusKey;
          }

          // Close connection if job is completed or errored
          if (job.status === 'completed' || job.status === 'error') {
            sendEvent({ ...statusData, done: true });
            clearInterval(interval);
            controller.close();
          }
        } catch (error) {
          sendEvent({ error: 'Failed to fetch job status' });
          clearInterval(interval);
          controller.close();
        }
      }, 1000); // Poll every 1 second

      // Cleanup on close
      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
