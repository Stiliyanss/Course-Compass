import { useState } from 'react';
import { useAdminDashboard } from '../../hooks/useAdminDashboard';
import { useAuth } from '../../context/AuthContext';
import { Users, BookOpen, DollarSign, GraduationCap, Sparkles } from 'lucide-react';
import Spinner from '../../components/ui/Spinner';

export default function AdminDashboardPage() {
  const { profile } = useAuth();
  const { data, isLoading, isError, error } = useAdminDashboard();
  const [activeTab, setActiveTab] = useState('students');

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
          Failed to load dashboard: {error.message}
        </div>
      </div>
    );
  }

  const { totalUsers, totalCourses, totalRevenue, totalEnrollments } = data;

  const sharedStats = [
    { label: 'Total Users',       value: totalUsers,       icon: Users,          color: 'purple' },
    { label: 'Total Courses',     value: totalCourses,     icon: BookOpen,       color: 'blue' },
    { label: 'Total Revenue',     value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'green' },
    { label: 'Total Enrollments', value: totalEnrollments, icon: GraduationCap,  color: 'amber' },
  ];

  const colorMap = {
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    blue:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
    green:  'bg-green-500/10 text-green-400 border-green-500/20',
    amber:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };

  return (
    <div className="p-6 space-y-8">
      {/* ── Hero banner ── */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950/40 px-5 py-5">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-purple-600/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-amber-600/8 blur-3xl" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

        <div className="relative">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-300">
            <Sparkles className="h-3 w-3" />
            Admin Dashboard
          </div>
          <h1
            className="text-3xl font-bold text-white md:text-4xl"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Welcome back, {profile?.full_name?.split(' ')[0] || 'Admin'}
          </h1>
          <p className="mt-1 text-gray-400">
            Platform overview and analytics
          </p>
        </div>
      </div>

      {/* ── Shared stat cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {sharedStats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-800 bg-slate-900 p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">{stat.label}</span>
              <div className={`rounded-lg border p-2 ${colorMap[stat.color]}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ── Tab bar ── */}
      <div className="flex gap-1 rounded-lg border border-slate-800 bg-slate-900 p-1">
        {['students', 'instructors'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-purple-600/20 text-purple-400'
                : 'text-gray-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {tab === 'students' ? 'Students' : 'Instructors'}
          </button>
        ))}
      </div>

      {/* ── Tab content (Steps 4 & 5) ── */}
      {activeTab === 'students' && (
        <div className="text-gray-400">Students tab content coming next...</div>
      )}

      {activeTab === 'instructors' && (
        <div className="text-gray-400">Instructors tab content coming next...</div>
      )}
    </div>
  );
}
