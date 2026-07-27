'use client';

import { useState, useEffect } from 'react';
import { BookOpen, AlertCircle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from './AuthProvider';
import ConfirmModal from './ConfirmModal';
import Toast from './Toast';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

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

interface HistoryEntry {
  mangaId: number;
  chapterNumber: string;
  lastImage: number;
  totalImages: number | null;
}

interface DashboardProps {
  mangaList?: Manga[];
}

export default function Dashboard({ mangaList: mangaListProp }: DashboardProps) {
  const mangaList = mangaListProp || [];
  const { user } = useAuth();

  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null);
  const [userHistory, setUserHistory] = useState<Record<number, HistoryEntry>>({});

  useEffect(() => {
    fetch('/api/users/history')
      .then((res) => res.json())
      .then((data) => {
        const map: Record<number, HistoryEntry> = {};
        (data.history || []).forEach((h: HistoryEntry & { mangaId: number }) => {
          map[h.mangaId] = h;
        });
        setUserHistory(map);
      })
      .catch(() => {});
  }, []);

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
    <div>
      {/* Manga List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Manga Collection</h2>
        </div>

        {mangaList.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No manga yet. Start by scraping a manga!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {mangaList.map((manga) => {
              const history = userHistory[manga.id];
              return (
                <Link
                  key={manga.id}
                  href={`/manga/${manga.id}`}
                  className="flex items-start space-x-3 px-4 py-3 sm:items-center sm:space-x-5 sm:px-6 sm:py-4 hover:bg-gray-50 transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="w-12 h-16 sm:w-20 sm:h-28 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    {manga.thumbnail ? (
                      <img src={manga.thumbnail} alt={manga.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    {/* Mobile: stacked layout */}
                    <div className="sm:hidden">
                      <h3 className="font-medium text-gray-900 truncate">{manga.title}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">{manga.source}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{manga.totalImages || 0} images</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-500">{manga.totalChapters || 0} chapters</span>
                        <Badge status={(manga.statusDl as 'pending' | 'downloading' | 'completed' | 'error') || 'pending'} />
                      </div>
                      {history && (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 mt-1.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>chapter {parseFloat(history.chapterNumber).toString()}</span>
                          <span>page {history.lastImage}/{history.totalImages || '?'}</span>
                        </div>
                      )}
                    </div>

                    {/* Desktop: horizontal layout */}
                    <div className="hidden sm:block">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 truncate">{manga.title}</h3>
                        <Badge status={(manga.statusDl as 'pending' | 'downloading' | 'completed' | 'error') || 'pending'} />
                      </div>
                      <p className="text-sm text-gray-500">{manga.source}</p>
                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                        <span>{manga.totalChapters || 0} chapters</span>
                        <span>{manga.totalImages || 0} images</span>
                      </div>
                      {history && (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 mt-1.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>chapter {parseFloat(history.chapterNumber).toString()}</span>
                          <span>page {history.lastImage}/{history.totalImages || '?'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right side: delete */}
                  <div className="flex items-center gap-2 sm:ml-4 mt-1 sm:mt-0 flex-shrink-0">
                    {user?.role === 'admin' && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={(e) => handleDelete(e, manga.id, manga.title)}
                        title="Delete manga"
                        icon={<Trash2 className="w-4 h-4" />}
                      />
                    )}
                  </div>
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

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
