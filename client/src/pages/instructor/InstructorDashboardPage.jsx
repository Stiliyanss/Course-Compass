import { useInstructorDashboard } from '../../hooks/useInstructorDashboard';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, BookCheck, Users, DollarSign, Sparkles, GraduationCap } from 'lucide-react';
import Spinner from '../../components/ui/Spinner';

export default function InstructorDashboardPage() {
  const { profile } = useAuth();
  const { data, isLoading, isError, error } = useInstructorDashboard();

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

  const { totalCourses, publishedCourses, uniqueStudents, totalRevenue } = data;

  return (
    <div className="p-6 space-y-8">
      {/* ── Hero banner ── */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950/40 px-5 py-5">
        {/* Decorative glow orbs */}
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-purple-600/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-amber-600/8 blur-3xl" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

        <div className="relative flex flex-col md:flex-row md:items-center gap-6">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-300">
              <Sparkles className="h-3 w-3" />
              Instructor Dashboard
            </div>
            <h1
              className="text-3xl font-bold text-white md:text-4xl"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Welcome back, {profile?.full_name?.split(' ')[0] || 'Instructor'}
            </h1>
            <p className="mt-2 text-gray-400 max-w-md">
              Manage your courses, track student engagement, and grow your impact.
            </p>
          </div>

          {/* Instructor avatar */}
          <div className="hidden md:flex flex-col items-center shrink-0">
            <div className="relative">
              {/* Glow ring behind avatar */}
              <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-purple-500/40 to-amber-500/30 blur-sm" />
              <div className="relative h-28 w-28 rounded-full border-2 border-purple-500/30 overflow-hidden bg-slate-800">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-600/20 to-slate-800">
                    <span className="text-3xl font-bold text-purple-300">
                      {profile?.full_name?.charAt(0)?.toUpperCase() || 'I'}
                    </span>
                  </div>
                )}
              </div>
              {/* Live courses badge */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full border border-green-500/30 bg-slate-900 px-2.5 py-0.5 text-[11px] font-bold text-green-400">
                {publishedCourses} live
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={BookOpen}
          label="Total Courses"
          value={totalCourses}
          gradient="from-purple-600/20 to-purple-900/10"
          borderColor="border-purple-500/20"
          iconBg="bg-purple-500/15"
          color="text-purple-400"
          glowColor="shadow-[0_0_15px_rgba(168,85,247,0.08)]"
        />
        <StatCard
          icon={BookCheck}
          label="Published"
          value={publishedCourses}
          gradient="from-green-600/20 to-green-900/10"
          borderColor="border-green-500/20"
          iconBg="bg-green-500/15"
          color="text-green-400"
          glowColor="shadow-[0_0_15px_rgba(34,197,94,0.08)]"
        />
        <StatCard
          icon={Users}
          label="Total Students"
          value={uniqueStudents}
          gradient="from-blue-600/20 to-blue-900/10"
          borderColor="border-blue-500/20"
          iconBg="bg-blue-500/15"
          color="text-blue-400"
          glowColor="shadow-[0_0_15px_rgba(59,130,246,0.08)]"
        />
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={`$${totalRevenue.toFixed(2)}`}
          gradient="from-amber-600/20 to-amber-900/10"
          borderColor="border-amber-500/20"
          iconBg="bg-amber-500/15"
          color="text-amber-400"
          glowColor="shadow-[0_0_15px_rgba(245,158,11,0.08)]"
        />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, gradient, borderColor, iconBg, color, glowColor }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border ${borderColor} bg-gradient-to-br ${gradient} p-5 ${glowColor}`}>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          <p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBg} border border-white/5`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      </div>
    </div>
  );
}
