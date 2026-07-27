'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/components/AuthProvider';
import { Loader2, Users, CheckCircle, XCircle, Shield, User } from 'lucide-react';
import Toast from '@/components/Toast';
import Button from '@/components/ui/Button';
import DropdownMenu, { DropdownItem } from '@/components/ui/DropdownMenu';

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string | null;
  isActive: boolean | null;
  createdAt: string | null;
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data.users);
    } catch {
      setToast({ message: 'Failed to load users', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (user: UserData) => {
    setUpdatingId(user.id);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update user');
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u))
      );
      setToast({
        message: user.isActive ? `${user.name} ditolak` : `${user.name} disetujui`,
        type: 'success',
      });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Failed to update user', type: 'error' });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleChangeRole = async (user: UserData, newRole: 'admin' | 'customer') => {
    setUpdatingId(user.id);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update user');
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
      );
      setToast({ message: `${user.name} sekarang ${newRole}`, type: 'success' });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Failed to update user', type: 'error' });
    } finally {
      setUpdatingId(null);
    }
  };

  const pendingUsers = users.filter((u) => !u.isActive);
  const activeUsers = users.filter((u) => u.isActive);

  function getPendingDropdownItems(u: UserData): DropdownItem[] {
    return [
      {
        label: 'Setujui',
        icon: updatingId === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />,
        onClick: () => handleToggleActive(u),
        disabled: updatingId === u.id,
      },
      {
        label: 'Tolak',
        icon: <XCircle className="w-4 h-4" />,
        onClick: () => handleToggleActive(u),
        variant: 'danger',
        disabled: updatingId === u.id,
      },
    ];
  }

  function getActiveDropdownItems(u: UserData): DropdownItem[] {
    if (u.id === currentUser?.id) return [];
    const items: DropdownItem[] = [];

    if (u.role === 'customer') {
      items.push({
        label: 'Jadikan Admin',
        icon: <Shield className="w-4 h-4" />,
        onClick: () => handleChangeRole(u, 'admin'),
        disabled: updatingId === u.id,
      });
    } else {
      items.push({
        label: 'Jadikan Customer',
        icon: <User className="w-4 h-4" />,
        onClick: () => handleChangeRole(u, 'customer'),
        disabled: updatingId === u.id,
      });
    }

    items.push({
      label: 'Nonaktifkan',
      icon: <XCircle className="w-4 h-4" />,
      onClick: () => handleToggleActive(u),
      variant: 'danger',
      disabled: updatingId === u.id,
    });

    return items;
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Users</h1>
            <p className="mt-2 text-gray-600">
              Approve user dan manage role
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users className="w-5 h-5" />
            <span>{users.length} users</span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            {/* Pending Approval */}
            {pendingUsers.length > 0 && (
              <div className="bg-white rounded-lg shadow-md">
                <div className="px-6 py-4 border-b border-gray-200 bg-yellow-50 rounded-t-lg">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-yellow-600" />
                    Menunggu Persetujuan ({pendingUsers.length})
                  </h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {pendingUsers.map((u) => (
                    <div key={u.id} className="px-6 py-4 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{u.name}</p>
                        <p className="text-sm text-gray-500 truncate">{u.email}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString('id-ID') : '-'}
                        </p>
                      </div>
                      {/* Desktop: inline buttons */}
                      <div className="hidden sm:flex items-center gap-2 ml-4">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleToggleActive(u)}
                          disabled={updatingId === u.id}
                          icon={updatingId === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        >
                          Setujui
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleToggleActive(u)}
                          disabled={updatingId === u.id}
                        >
                          Tolak
                        </Button>
                      </div>
                      {/* Mobile: 3-dot dropdown */}
                      <div className="sm:hidden ml-4">
                        <DropdownMenu items={getPendingDropdownItems(u)} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Users */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-gray-200 rounded-t-lg">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  User Aktif ({activeUsers.length})
                </h2>
              </div>
              {activeUsers.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500">
                  Belum ada user aktif
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {activeUsers.map((u) => (
                    <div key={u.id} className="px-6 py-4 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 truncate">{u.name}</p>
                          {u.role === 'admin' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                              <Shield className="w-3 h-3" />
                              Admin
                            </span>
                          )}
                          {u.role === 'customer' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                              <User className="w-3 h-3" />
                              Customer
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">{u.email}</p>
                      </div>
                      {u.id !== currentUser?.id && (
                        <>
                          {/* Desktop: inline buttons */}
                          <div className="hidden sm:flex items-center gap-2 ml-4">
                            {u.role === 'customer' ? (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleChangeRole(u, 'admin')}
                                disabled={updatingId === u.id}
                                icon={<Shield className="w-4 h-4" />}
                              >
                                Jadikan Admin
                              </Button>
                            ) : (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleChangeRole(u, 'customer')}
                                disabled={updatingId === u.id}
                                icon={<User className="w-4 h-4" />}
                              >
                                Jadikan Customer
                              </Button>
                            )}
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleToggleActive(u)}
                              disabled={updatingId === u.id}
                            >
                              Nonaktifkan
                            </Button>
                          </div>
                          {/* Mobile: 3-dot dropdown */}
                          <div className="sm:hidden ml-4">
                            <DropdownMenu items={getActiveDropdownItems(u)} />
                          </div>
                        </>
                      )}
                      {u.id === currentUser?.id && (
                        <span className="text-xs text-gray-400 ml-4">Akun Anda</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </ProtectedRoute>
  );
}
