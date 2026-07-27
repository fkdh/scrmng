'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { scrapeJobInputSchema, type ScrapeJobInput } from '@/lib/schemas';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Globe, AlertCircle, Download } from 'lucide-react';
import Button from './ui/Button';

const SUPPORTED_SITES = [
  { name: 'Komiku', pattern: 'komiku.org', icon: '📚' },
];

function detectWebsite(url: string) {
  if (!url) return null;
  for (const site of SUPPORTED_SITES) {
    if (url.includes(site.pattern)) {
      return site;
    }
  }
  return null;
}

export default function ScrapeForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detectedSite, setDetectedSite] = useState<typeof SUPPORTED_SITES[0] | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ScrapeJobInput>({
    resolver: zodResolver(scrapeJobInputSchema),
    defaultValues: {
      startChapter: 1,
      endChapter: 10,
    },
  });

  const url = watch('url');

  useEffect(() => {
    if (url) {
      const detected = detectWebsite(url);
      setDetectedSite(detected);
    } else {
      setDetectedSite(null);
    }
  }, [url]);

  const onSubmit = async (data: ScrapeJobInput) => {
    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Failed to start scraping');
      }

      const result = await res.json();
      router.push(`/scrape/${result.job.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Start Scraping</h2>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* URL Input */}
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
              Manga URL
            </label>
            <input
              id="url"
              type="url"
              {...register('url')}
              placeholder="https://komiku.org/manga/manga-title/"
              className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            />
            {errors.url && (
              <p className="mt-1 text-sm text-red-600">{errors.url.message}</p>
            )}

            {/* Detected Site */}
            {detectedSite && (
              <div className="mt-2 flex items-center space-x-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                <Globe className="w-4 h-4" />
                <span>
                  Detected: <strong>{detectedSite.name}</strong>
                </span>
              </div>
            )}

            {!detectedSite && url && (
              <div className="mt-2 flex items-center space-x-2 text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span>Website belum didukung</span>
              </div>
            )}
          </div>

          {/* Chapter Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startChapter" className="block text-sm font-medium text-gray-700 mb-2">
                Start Chapter
              </label>
              <input
                id="startChapter"
                type="number"
                min="0"
                step="1"
                {...register('startChapter', { valueAsNumber: true })}
                className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              />
              {errors.startChapter && (
                <p className="mt-1 text-sm text-red-600">{errors.startChapter.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="endChapter" className="block text-sm font-medium text-gray-700 mb-2">
                End Chapter
              </label>
              <input
                id="endChapter"
                type="number"
                min="0"
                step="1"
                {...register('endChapter', { valueAsNumber: true })}
                className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              />
              {errors.endChapter && (
                <p className="mt-1 text-sm text-red-600">{errors.endChapter.message}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
            disabled={isSubmitting || !detectedSite}
            icon={isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
          >
            {isSubmitting ? 'Starting...' : 'Start Scraping'}
          </Button>
        </form>
      </div>
    </div>
  );
}
