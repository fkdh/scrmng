'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import Dashboard from '@/components/Dashboard';
import SearchFilter from '@/components/SearchFilter';
import { useState, useEffect, useCallback } from 'react';

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

function HomePageContent() {
  const [mangaList, setMangaList] = useState<Manga[]>([]);
  const [filteredManga, setFilteredManga] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchManga() {
      try {
        const res = await fetch('/api/manga');
        if (res.ok) {
          const data = await res.json();
          setMangaList(data.manga || []);
          setFilteredManga(data.manga || []);
        }
      } catch (error) {
        console.error('Failed to fetch manga:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchManga();
  }, []);

  const handleFilterChange = useCallback(
    (filters: { search: string; source: string; status: string }) => {
      let result = [...mangaList];

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        result = result.filter((m) => m.title.toLowerCase().includes(searchLower));
      }

      if (filters.source) {
        result = result.filter((m) => m.source === filters.source);
      }

      if (filters.status) {
        result = result.filter((m) => m.statusDl === filters.status);
      }

      setFilteredManga(result);
    },
    [mangaList]
  );

  const stats = {
    totalManga: filteredManga.length,
    totalChapters: filteredManga.reduce((sum, m) => sum + (m.totalChapters || 0), 0),
    totalImages: filteredManga.reduce((sum, m) => sum + (m.totalImages || 0), 0),
    pendingJobs: filteredManga.filter((m) => m.statusDl === 'downloading' || m.statusDl === 'pending').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      </div>

      <SearchFilter onFilterChange={handleFilterChange} />

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-gray-500">Loading...</div>
        </div>
      ) : (
        <Dashboard mangaList={filteredManga} stats={stats} />
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <ProtectedRoute>
      <HomePageContent />
    </ProtectedRoute>
  );
}
