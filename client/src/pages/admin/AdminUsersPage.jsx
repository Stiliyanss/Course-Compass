import { useState } from 'react';
import { useAllUsers, useUpdateUserRole } from '../../hooks/useUsers';
import { Users, Shield, GraduationCap, BookOpen, Calendar, Search, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const { data: users, isLoading, isError, error } = useAllUsers();
  const roleMutation = useUpdateUserRole();

  // Which user's confirm dialog is open (null = none)
  const [confirmId, setConfirmId] = useState(null);

  // Filter by role
  const [roleFilter, setRoleFilter] = useState('all');

  // Search by name or email
  const [search, setSearch] = useState('');

  function handleDemote(id) {
    roleMutation.mutate(
      { id, role: 'student' },
      {
        onSuccess: () => {
          toast.success('User demoted to student');
          setConfirmId(null);
        },
        onError: (err) => toast.error(err.message),
      }
    );
  }

  if (isLoading) {
    return (
      <div className="py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-400">
          Failed to load users: {error.message}
        </div>
      </div>
    );
  }

  // Apply filters
  const filtered = users.filter((user) => {
    if (roleFilter !== 'all' && user.role !== roleFilter) return false;
    if (search) {
      const term = search.toLowerCase();
      return (
        user.full_name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term)
      );
    }
    return true;
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-2xl font-bold text-white md:text-3xl"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Manage Users
        </h1>
        <p className="mt-1 text-gray-400">
          View all users and manage their roles
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <StatCard
          label="Students"
          count={users.filter((u) => u.role === 'student').length}
          icon={GraduationCap}
          color="text-blue-400"
          bg="bg-blue-400/10"
        />
        <StatCard
          label="Instructors"
          count={users.filter((u) => u.role === 'instructor').length}
          icon={BookOpen}
          color="text-purple-400"
          bg="bg-purple-400/10"
        />
        <StatCard
          label="Admins"
          count={users.filter((u) => u.role === 'admin').length}
          icon={Shield}
          color="text-amber-400"
          bg="bg-amber-400/10"
        />
      </div>

      {/* Filters row */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
        </div>

        {/* Role filter */}
        <div className="relative">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="appearance-none rounded-lg border border-slate-700 bg-slate-800 py-2 pl-4 pr-10 text-sm text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="instructor">Instructors</option>
            <option value="admin">Admins</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        </div>
      </div>

      {/* Users table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-12 text-center">
          <Users className="mx-auto h-10 w-10 text-gray-600" />
          <p className="mt-3 text-gray-400">No users found</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-800">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map((user) => (
                <tr key={user.id} className="bg-slate-900/30 hover:bg-slate-900/60 transition-colors">
                  {/* User info */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-600/20 text-sm font-bold text-purple-400">
                        {user.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-white">{user.full_name || 'Unnamed'}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Role badge */}
                  <td className="px-6 py-4">
                    <RoleBadge role={user.role} />
                  </td>

                  {/* Joined date */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-400">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(new Date(user.created_at), 'MMM d, yyyy')}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    {user.role === 'instructor' && (
                      <>
                        {confirmId === user.id ? (
                          <div className="inline-flex items-center gap-2">
                            <span className="text-sm text-gray-400">Demote?</span>
                            <Button
                              variant="danger"
                              onClick={() => handleDemote(user.id)}
                              loading={roleMutation.isPending}
                              className="text-xs px-3 py-1"
                            >
                              Yes
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => setConfirmId(null)}
                              className="text-xs px-3 py-1"
                            >
                              No
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            onClick={() => setConfirmId(user.id)}
                            className="text-xs px-3 py-1"
                          >
                            Demote to Student
                          </Button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, count, icon: Icon, color, bg }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          <p className={`text-2xl font-bold ${color}`}>{count}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bg}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
      </div>
    </div>
  );
}

function RoleBadge({ role }) {
  const styles = {
    student: 'bg-blue-400/10 text-blue-400 border-blue-400/30',
    instructor: 'bg-purple-400/10 text-purple-400 border-purple-400/30',
    admin: 'bg-amber-400/10 text-amber-400 border-amber-400/30',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[role]}`}>
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </span>
  );
}
