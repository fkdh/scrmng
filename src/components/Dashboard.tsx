'use client';

import { useState, useCallback } from 'react';
import { BookOpen, Download, CheckCircle, Clock, AlertCircle, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ConfirmModal from './ConfirmModal';
import Toast from './Toast';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ScrapeModal from './ScrapeModal';

interface Manga {
  id: number;
  title: string;
  thumbnail: string | null;
  source: string;
  totalChapters: number | null;
  totalImages: number | null;
  statusDl: string | null;
  createdAt: Date | null;
}

interface Stats {
  totalManga: number;
  totalChapters: number;
  totalImages: number;
  pendingJobs: number;
}

interface DashboardProps {
  mangaList?: Manga[];
  stats?: Stats;
}

export default function Dashboard({ mangaList: mangaListProp, stats: statsProp }: DashboardProps) {
  const mangaList = mangaListProp || [];
  const stats = statsProp || { totalManga: 0, totalChapters: 0, totalImages: 0, pendingJobs: 0 };
  const router = useRouter();

  const [confirmModal, setConfirmModal] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null);
  const [scrapeModal, setScrapeModal] = useState(false);

  const handleCreateScrape = async (url: string, startChapter: number, endChapter: number) => {
    const res = await fetch('/api/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, startChapter, endChapter }),
    });
    if (!res.ok) {
      const result = await res.json().catch(() => ({}));
      throw new Error(result.error || 'Failed to start scraping');
    }
    const result = await res.json();
    router.push(`/scrape/${result.job.id}`);
  };

  const handleDelete = async (e: React.MouseEvent, mangaId: number, title: string) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmModal({
      open: true,
      title: `Delete "${title}"?`,
      message: 'This will permanently remove this manga and all its chapters.',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, open: false }));
        try {
          const res = await fetch(`/api/manga/${mangaId}`, { method: 'DELETE' });
          if (res.ok) {
            window.location.reload();
          }
        } catch {
          setToast({ message: 'Failed to delete manga', type: 'error' });
        }
      },
    });
  };

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Manga</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalManga}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Chapters</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalChapters}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 rounded-full">
              <Download className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Images</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalImages}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-amber-100 rounded-full">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingJobs}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex justify-end">
        <Button
          variant="primary"
          size="md"
          onClick={() => setScrapeModal(true)}
          icon={<Plus className="w-5 h-5" />}
        >
          New Scrape
        </Button>
      </div>

      {/* Manga List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Manga Collection</h2>
        </div>

        {mangaList.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No manga yet. Start by scraping a manga!</p>
            <Button
              variant="primary"
              size="md"
              onClick={() => setScrapeModal(true)}
              icon={<Plus className="w-5 h-5" />}
              className="mt-4"
            >
              Start Scraping
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {mangaList.map((manga) => {
              return (
                <Link
                  key={manga.id}
                  href={`/manga/${manga.id}`}
                  className="flex items-center space-x-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    {manga.thumbnail ? (
                      <img
                        src={manga.thumbnail}
                        alt={manga.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{manga.title}</h3>
                    <p className="text-sm text-gray-500">{manga.source}</p>
                    <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                      <span>{manga.totalChapters || 0} chapters</span>
                      <span>{manga.totalImages || 0} images</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <Badge status={(manga.statusDl as "pending" | "downloading" | "completed" | "error") || "pending"} />

                  {/* Delete Button */}
                  <Button
                    variant="danger"
                    onClick={(e) => handleDelete(e, manga.id, manga.title)}
                    title="Delete manga"
                    icon={<Trash2 className="w-4 h-4" />}
                  />
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
      />

      <ScrapeModal
        open={scrapeModal}
        mode="create"
        onClose={() => setScrapeModal(false)}
        onSubmit={handleCreateScrape}
      />

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
