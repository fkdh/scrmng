'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, X } from 'lucide-react';
import Button from './ui/Button';

interface SearchFilterProps {
  onFilterChange: (filters: FilterState) => void;
}

interface FilterState {
  search: string;
  source: string;
  status: string;
}

const SOURCES = [
  { value: '', label: 'All Sources' },
  { value: 'komiku', label: 'Komiku' },
];

const STATUSES = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'downloading', label: 'Downloading' },
  { value: 'completed', label: 'Completed' },
  { value: 'error', label: 'Error' },
];

export default function SearchFilter({ onFilterChange }: SearchFilterProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    source: '',
    status: '',
  });

  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    onFilterChange({ ...filters, search: debouncedSearch });
  }, [debouncedSearch, filters.source, filters.status, onFilterChange]);

  const handleClear = useCallback(() => {
    setFilters({ search: '', source: '', status: '' });
  }, []);

  const hasActiveFilters = filters.search || filters.source || filters.status;

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search manga..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
          />
        </div>

        <div className="relative w-full sm:w-auto">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={filters.source}
            onChange={(e) => setFilters({ ...filters, source: e.target.value })}
            className="w-full pl-9 pr-8 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors appearance-none bg-white"
          >
            {SOURCES.map((source) => (
              <option key={source.value} value={source.value}>
                {source.label}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-auto">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="w-full pl-4 pr-8 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors appearance-none bg-white"
          >
            {STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleClear} icon={<X className="w-4 h-4" />}>
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
