'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import ProgressTracker from '@/components/ProgressTracker';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface Chapter {
  id: number;
  chapterNumber: string;
  title: string | null;
  totalImages: number | null;
  downloadedImages: number | null;
  status: string | null;
  sourceUrl: string;
  errorMessage: string | null;
}

interface Manga {
  id: number;
  title: string;
  slug: string;
  thumbnail: string | null;
  source: string;
  sourceUrl: string;
  totalChapters: number | null;
  totalImages: number | null;
}

interface Job {
  id: number;
  source: string;
  sourceUrl: string;
  mangaId: number | null;
  startChapter: string | null;
  endChapter: string | null;
  status: string | null;
  progress: number | null;
  total: number | null;
  currentChapter: string | null;
  errorMessage: string | null;
}

function ScrapeDetailContent() {
  const params = useParams();
  const jobId = params.jobId as string;
  const [job, setJob] = useState<Job | null>(null);
  const [manga, setManga] = useState<Manga | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchJob() {
      try {
        const res = await fetch(`/api/scrape/${jobId}`);
        if (!res.ok) throw new Error('Job not found');
        const data = await res.json();
        setJob(data.job);

        if (data.job.mangaId) {
          const mangaRes = await fetch(`/api/manga/${data.job.mangaId}`);
          if (mangaRes.ok) {
            const mangaData = await mangaRes.json();
            setManga(mangaData.manga);
            setChapters(mangaData.manga.chapters || []);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load job');
      } finally {
        setLoading(false);
      }
    }
    fetchJob();
  }, [jobId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-red-600 mb-4">{error || 'Job not found'}</p>
        <Link href="/" className="text-blue-600 hover:text-blue-800">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
    queued: { color: 'text-gray-600', bg: 'bg-gray-100', label: 'Queued' },
    running: { color: 'text-blue-600', bg: 'bg-blue-100', label: 'Running' },
    completed: { color: 'text-green-600', bg: 'bg-green-100', label: 'Completed' },
    error: { color: 'text-red-600', bg: 'bg-red-100', label: 'Error' },
  };

  const status = statusConfig[job.status || 'queued'] || statusConfig.queued;
  const totalImages = chapters.reduce((sum, ch) => sum + (ch.totalImages || 0), 0);
  const downloadedImages = chapters.reduce((sum, ch) => sum + (ch.downloadedImages || 0), 0);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/"
        className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </Link>

      {/* Job Info */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Scrape Job #{job.id}</h1>
          <div className={`px-3 py-1 rounded-full ${status.bg}`}>
            <span className={`text-sm font-medium ${status.color}`}>{status.label}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <span className="text-gray-500">Source:</span>
            <span className="ml-2 text-gray-900">{job.source}</span>
          </div>
          <div>
            <span className="text-gray-500">URL:</span>
            <a
              href={job.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-blue-600 hover:text-blue-800 inline-flex items-center space-x-1"
            >
              <span className="truncate max-w-[300px]">{job.sourceUrl}</span>
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
            </a>
          </div>
          <div>
            <span className="text-gray-500">Chapter Range:</span>
            <span className="ml-2 text-gray-900">
              {parseFloat(job.startChapter || '0').toString()} - {parseFloat(job.endChapter || '0').toString() || '∞'}
            </span>
          </div>
        </div>

        {/* Progress */}
        <ProgressTracker jobId={job.id} onComplete={() => {
          // Refresh chapters
          if (job.mangaId) {
            fetch(`/api/manga/${job.mangaId}`)
              .then((r) => r.json())
              .then((d) => {
                if (d.manga) {
                  setChapters(d.manga.chapters || []);
                  setManga(d.manga);
                }
              });
          }
        }} />
      </div>

      {/* Manga Info (if available) */}
      {manga && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Manga Info</h2>
          <div className="flex items-center space-x-4">
            {manga.thumbnail && (
              <img
                src={manga.thumbnail}
                alt={manga.title}
                className="w-16 h-24 object-cover rounded"
              />
            )}
            <div>
              <p className="font-medium text-gray-900">{manga.title}</p>
              <p className="text-sm text-gray-500">
                {chapters.length} chapters • {totalImages} images ({downloadedImages} downloaded)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Chapter List */}
      {chapters.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Chapters</h2>
          </div>
          <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
            {chapters.map((chapter) => {
              const chStatus = statusConfig[chapter.status || 'queued'] || statusConfig.queued;
              return (
                <div key={chapter.id} className="flex items-center justify-between px-6 py-3">
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">
                      Chapter {parseFloat(chapter.chapterNumber).toString()}
                    </span>
                    {chapter.title && chapter.title !== `Chapter ${parseFloat(chapter.chapterNumber).toString()}` && (
                      <span className="ml-2 text-sm text-gray-500">- {chapter.title}</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    {chapter.totalImages && chapter.totalImages > 0 && (
                      <span className="text-sm text-gray-500">
                        {chapter.downloadedImages || 0}/{chapter.totalImages} images
                      </span>
                    )}
                    <div className={`px-2 py-0.5 rounded text-xs font-medium ${chStatus.bg} ${chStatus.color}`}>
                      {chStatus.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ScrapeDetailPage() {
  return (
    <ProtectedRoute>
      <ScrapeDetailContent />
    </ProtectedRoute>
  );
}
