'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { Home, Users, BookOpen, Menu, User, LogOut } from 'lucide-react';
import DropdownMenu from './ui/DropdownMenu';
import Drawer from './ui/Drawer';

const NAV_LINKS = [
  { href: '/', label: 'Dashboard', icon: Home, adminOnly: false },
  { href: '/users', label: 'Manage Users', icon: Users, adminOnly: true },
];

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (loading) return null;
  if (!user) return null;

  const initial = user.name?.charAt(0).toUpperCase() || '?';

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left: Hamburger + Logo */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setDrawerOpen(true)}
              className="sm:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>

            <Link href="/" className="flex items-center space-x-2 text-xl font-bold text-gray-900">
              <BookOpen className="w-6 h-6 text-blue-600" />
              <span>Manga Scraper</span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden sm:flex sm:space-x-4">
              {NAV_LINKS.filter((l) => !l.adminOnly || user.role === 'admin').map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                >
                  <link.icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Right: Desktop name+role + Avatar dropdown */}
          <div className="flex items-center space-x-3">
            {/* Desktop: show name and role */}
            <div className="hidden sm:flex sm:items-center sm:gap-2 sm:text-right">
              <div>
                <p className="text-sm font-medium text-gray-900 leading-tight">{user.name}</p>
                <p className="text-xs text-gray-500 leading-tight">{user.role}</p>
              </div>
            </div>

            {/* Avatar dropdown */}
            <DropdownMenu
              align="right"
              trigger={
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold select-none">
                  {initial}
                </div>
              }
              items={[
                // Mobile only: show name + role at top
                {
                  label: `${user.name} (${user.role})`,
                  disabled: true,
                  className: 'sm:hidden font-semibold text-gray-700',
                },
                { label: '', divider: true, className: 'sm:hidden' },
                {
                  label: 'Profile',
                  icon: <User className="w-4 h-4" />,
                  onClick: () => router.push('/account'),
                },
                {
                  label: 'History',
                  icon: <BookOpen className="w-4 h-4" />,
                  onClick: () => router.push('/history'),
                },
                { label: '', divider: true },
                {
                  label: 'Logout',
                  icon: <LogOut className="w-4 h-4" />,
                  onClick: logout,
                  variant: 'danger',
                },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Menu">
        {NAV_LINKS.filter((l) => !l.adminOnly || user.role === 'admin').map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setDrawerOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <link.icon className="w-5 h-5 text-gray-500" />
            <span>{link.label}</span>
          </Link>
        ))}
      </Drawer>
    </nav>
  );
}
