'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, BookOpen, Clock } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';

interface HistoryItem {
  id: number;
  mangaId: number;
  chapterNumber: string;
  lastImage: number;
  updatedAt: string;
  mangaTitle: string;
  mangaSlug: string;
  mangaSource: string;
  mangaThumbnail: string | null;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/users/history')
      .then((res) => res.json())
      .then((data) => setHistory(data.history || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">History</h1>
          <p className="mt-2 text-gray-600">Lanjut baca manga yang pernah kamu baca</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : history.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Belum ada riwayat baca</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {history.map((item) => (
              <Link
                key={item.id}
                href={`/manga/${item.mangaId}?chapter=${item.chapterNumber}&page=${item.lastImage}`}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow flex"
              >
                {item.mangaThumbnail ? (
                  <img
                    src={item.mangaThumbnail}
                    alt={item.mangaTitle}
                    className="w-20 h-28 object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-20 h-28 bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-6 h-6 text-gray-300" />
                  </div>
                )}
                <div className="p-3 flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate text-sm">{item.mangaTitle}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.mangaSource}</p>
                  <p className="text-xs text-blue-600 mt-2 font-medium">
                    Ch {item.chapterNumber} - Page {item.lastImage}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(item.updatedAt).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
