'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import ScrapeForm from '@/components/ScrapeForm';

export default function ScrapePage() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Scrape Manga</h1>
          <p className="mt-2 text-gray-600">
            Enter a manga URL and chapter range to start scraping
          </p>
        </div>

        <ScrapeForm />
      </div>
    </ProtectedRoute>
  );
}
