import { Link } from 'react-router-dom';
import { useDashboardData } from '../../hooks/useDashboard';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, CheckCircle, TrendingUp, Clock, FileText, Video, File, ArrowRight, Sparkles, GraduationCap, Target, Flame } from 'lucide-react';
import { format } from 'date-fns';
import Spinner from '../../components/ui/Spinner';

export default function StudentDashboardPage() {
  const { profile } = useAuth();
  const { data, isLoading, isError, error } = useDashboardData();

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

  const { enrollments, progress, recentActivity, streak } = data;

  const totalCourses = enrollments.length;
  const totalMaterials = Object.values(progress).reduce((sum, p) => sum + p.total, 0);
  const totalCompleted = Object.values(progress).reduce((sum, p) => sum + p.completed, 0);
  const overallPercent = totalMaterials > 0 ? Math.round((totalCompleted / totalMaterials) * 100) : 0;
  const coursesFinished = Object.values(progress).filter((p) => p.total > 0 && p.completed === p.total).length;

  return (
    <div className="p-6 space-y-8">
      {/* ── Hero welcome banner ── */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950/40 p-8">
        {/* Decorative glow orbs */}
        <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-purple-600/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-blue-600/10 blur-3xl" />

        <div className="relative flex items-center justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-300">
              <Sparkles className="h-3 w-3" />
              Learning Dashboard
            </div>
            <h1
              className="text-3xl font-bold text-white md:text-4xl"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Welcome back, {profile?.full_name?.split(' ')[0] || 'Student'}
            </h1>
            <p className="mt-2 text-gray-400 max-w-md">
              Track your learning journey, monitor progress, and keep building your skills.
            </p>
          </div>

          {/* Overall progress ring */}
          <div className="hidden md:flex flex-col items-center">
            <div className="relative flex h-28 w-28 items-center justify-center">
              {/* Background circle */}
              <svg className="absolute h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="6" className="text-slate-800" />
                <circle
                  cx="50" cy="50" r="42" fill="none" strokeWidth="6" strokeLinecap="round"
                  className={overallPercent === 100 ? 'text-green-400' : 'text-purple-400'}
                  strokeDasharray={`${overallPercent * 2.64} 264`}
                  style={{ filter: `drop-shadow(0 0 6px ${overallPercent === 100 ? 'rgba(34,197,94,0.4)' : 'rgba(168,85,247,0.4)'})`, transition: 'stroke-dasharray 0.8s ease' }}
                  stroke="currentColor"
                />
              </svg>
              <span className="text-2xl font-bold text-white">{overallPercent}%</span>
            </div>
            <span className="mt-1 text-xs text-gray-500">Overall</span>
          </div>
        </div>
      </div>

      {/* ── Stats cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          icon={Flame}
          label="Learning Streak"
          value={streak > 0 ? `${streak}-day` : '0 days'}
          gradient="from-orange-600/20 to-red-900/10"
          borderColor="border-orange-500/20"
          iconBg="bg-orange-500/15"
          color="text-orange-400"
          glowColor="shadow-[0_0_15px_rgba(249,115,22,0.08)]"
        />
        <StatCard
          icon={BookOpen}
          label="Enrolled Courses"
          value={totalCourses}
          gradient="from-purple-600/20 to-purple-900/10"
          borderColor="border-purple-500/20"
          iconBg="bg-purple-500/15"
          color="text-purple-400"
          glowColor="shadow-[0_0_15px_rgba(168,85,247,0.08)]"
        />
        <StatCard
          icon={TrendingUp}
          label="Courses Finished"
          value={coursesFinished}
          gradient="from-amber-600/20 to-amber-900/10"
          borderColor="border-amber-500/20"
          iconBg="bg-amber-500/15"
          color="text-amber-400"
          glowColor="shadow-[0_0_15px_rgba(245,158,11,0.08)]"
        />
        <StatCard
          icon={CheckCircle}
          label="Materials Completed"
          value={totalCompleted}
          gradient="from-green-600/20 to-green-900/10"
          borderColor="border-green-500/20"
          iconBg="bg-green-500/15"
          color="text-green-400"
          glowColor="shadow-[0_0_15px_rgba(34,197,94,0.08)]"
        />
        <StatCard
          icon={Target}
          label="Total Materials"
          value={totalMaterials}
          gradient="from-blue-600/20 to-blue-900/10"
          borderColor="border-blue-500/20"
          iconBg="bg-blue-500/15"
          color="text-blue-400"
          glowColor="shadow-[0_0_15px_rgba(59,130,246,0.08)]"
        />
      </div>

      {/* ── Main content grid ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Course progress — 2/3 width */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-purple-400" />
              <h2 className="text-lg font-semibold text-white">My Courses</h2>
            </div>
            {enrollments.length > 0 && (
              <Link
                to="/student/my-courses"
                className="text-xs text-gray-500 hover:text-purple-400 transition-colors"
              >
                View all
              </Link>
            )}
          </div>

          {enrollments.length === 0 ? (
            <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-10 text-center">
              <div className="absolute inset-0 bg-gradient-to-b from-purple-600/5 to-transparent" />
              <div className="relative">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/10 border border-purple-500/20">
                  <BookOpen className="h-7 w-7 text-purple-400" />
                </div>
                <p className="mt-4 text-gray-400">You haven't enrolled in any courses yet</p>
                <p className="mt-1 text-sm text-gray-600">Start your learning journey today</p>
                <Link to="/courses" className="mt-5 inline-block">
                  <button className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-medium text-white shadow-[0_0_15px_rgba(168,85,247,0.2)] hover:bg-purple-500 transition-colors">
                    Browse Courses
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {enrollments.map((enrollment) => {
                const p = progress[enrollment.course_id] || { completed: 0, total: 0 };
                const percent = p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0;
                const isComplete = percent === 100;

                return (
                  <Link
                    key={enrollment.course_id}
                    to={`/courses/${enrollment.course_id}`}
                    className="group block rounded-xl border border-slate-800 bg-slate-900/50 p-4 hover:border-purple-500/30 hover:shadow-[0_0_20px_rgba(168,85,247,0.06)] transition-all duration-300"
                  >
                    <div className="flex items-center gap-4">
                      {/* Thumbnail */}
                      <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-slate-800 bg-slate-800">
                        {enrollment.course?.image_url ? (
                          <img
                            src={enrollment.course.image_url}
                            alt={enrollment.course.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <BookOpen className="h-6 w-6 text-gray-700" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-white truncate pr-4 group-hover:text-purple-300 transition-colors">
                            {enrollment.course?.title || 'Unknown course'}
                          </h3>
                          <div className={`shrink-0 flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            isComplete
                              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                              : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          }`}>
                            {isComplete && <CheckCircle className="h-3 w-3" />}
                            {percent}%
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">
                          by {enrollment.course?.instructor_name}
                        </p>

                        {/* Progress bar */}
                        <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-800">
                          <div
                            className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out ${
                              isComplete
                                ? 'bg-gradient-to-r from-green-500 to-emerald-400 shadow-[0_0_10px_rgba(34,197,94,0.4)]'
                                : 'bg-gradient-to-r from-purple-600 via-purple-500 to-violet-400 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                          {percent > 0 && !isComplete && (
                            <div
                              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_2s_infinite]"
                              style={{ width: `${percent}%` }}
                            />
                          )}
                        </div>

                        <div className="mt-1.5 flex items-center justify-between">
                          <p className="text-[11px] text-gray-600">
                            {p.completed} / {p.total} materials
                          </p>
                          {isComplete && (
                            <span className="text-[11px] text-green-500 font-medium">Completed!</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent activity — 1/3 width */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden">
            {recentActivity.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 border border-slate-700">
                  <Clock className="h-5 w-5 text-gray-600" />
                </div>
                <p className="mt-3 text-sm text-gray-500">No activity yet</p>
                <p className="mt-1 text-xs text-gray-600">Complete materials to see your progress here</p>
              </div>
            ) : (
              <div>
                {recentActivity.map((activity, index) => {
                  const Icon = getActivityIcon(activity.fileType);
                  return (
                    <div
                      key={activity.materialId}
                      className={`flex items-start gap-3 px-4 py-3.5 hover:bg-slate-800/30 transition-colors ${
                        index < recentActivity.length - 1 ? 'border-b border-slate-800/50' : ''
                      }`}
                    >
                      {/* Timeline dot + line */}
                      <div className="flex flex-col items-center pt-1">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/20">
                          <Icon className="h-3.5 w-3.5 text-green-400" />
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white truncate">{activity.title}</p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{activity.courseName}</p>
                        <p className="mt-1 text-[11px] text-gray-600">
                          {format(new Date(activity.completedAt), 'MMM d · h:mm a')}
                        </p>
                      </div>

                      <span className="shrink-0 mt-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-400 border border-green-500/20">
                        Done
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * StatCard — a polished stat card with gradient background and glow.
 */
function StatCard({ icon: Icon, label, value, gradient, borderColor, iconBg, color, glowColor }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border ${borderColor} bg-gradient-to-br ${gradient} p-5 ${glowColor}`}>
      {/* Subtle top glow line */}
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

function getActivityIcon(fileType) {
  const videoTypes = ['mp4', 'webm', 'mov', 'avi'];
  const docTypes = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt'];

  if (videoTypes.includes(fileType)) return Video;
  if (docTypes.includes(fileType)) return FileText;
  return File;
}
