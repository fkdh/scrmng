'use client';

import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { LogOut, Home, Download, BookOpen } from 'lucide-react';
import Button from './ui/Button';

export default function Navbar() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2 text-xl font-bold text-gray-900">
              <BookOpen className="w-6 h-6 text-blue-600" />
              <span>Manga Scraper</span>
            </Link>

            <div className="hidden sm:flex sm:space-x-4">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/scrape"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Scrape</span>
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-600">{user.name}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              icon={<LogOut className="w-4 h-4" />}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
