import { Link } from 'react-router-dom';
import { useDashboardData } from '../../hooks/useDashboard';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, CheckCircle, TrendingUp, Clock, FileText, Video, File, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import Spinner from '../../components/ui/Spinner';

/**
 * StudentDashboardPage — the student's home page after login.
 *
 * Shows:
 * 1. Welcome message with the student's name
 * 2. Stats cards — enrolled courses, completed materials, overall progress
 * 3. Course progress — each enrolled course with its own progress bar
 * 4. Recent activity — last 5 materials the student completed
 */
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

  const { enrollments, progress, recentActivity } = data;

  // Calculate overall stats
  const totalCourses = enrollments.length;
  const totalMaterials = Object.values(progress).reduce((sum, p) => sum + p.total, 0);
  const totalCompleted = Object.values(progress).reduce((sum, p) => sum + p.completed, 0);
  const overallPercent = totalMaterials > 0 ? Math.round((totalCompleted / totalMaterials) * 100) : 0;

  return (
    <div className="p-6">
      {/* Welcome */}
      <div className="mb-8">
        <h1
          className="text-2xl font-bold text-white md:text-3xl"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Welcome back, {profile?.full_name?.split(' ')[0] || 'Student'}
        </h1>
        <p className="mt-1 text-gray-400">Here's your learning overview</p>
      </div>

      {/* Stats cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={BookOpen}
          label="Enrolled Courses"
          value={totalCourses}
          color="text-purple-400"
          bg="bg-purple-400/10"
        />
        <StatCard
          icon={CheckCircle}
          label="Materials Completed"
          value={totalCompleted}
          color="text-green-400"
          bg="bg-green-400/10"
        />
        <StatCard
          icon={TrendingUp}
          label="Overall Progress"
          value={`${overallPercent}%`}
          color="text-blue-400"
          bg="bg-blue-400/10"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Course progress — takes 2/3 on large screens */}
        <div className="lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-white">Course Progress</h2>

          {enrollments.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-gray-600" />
              <p className="mt-3 text-gray-400">No courses yet</p>
              <Link
                to="/courses"
                className="mt-3 inline-flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300"
              >
                Browse courses <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {enrollments.map((enrollment) => {
                const p = progress[enrollment.course_id] || { completed: 0, total: 0 };
                const percent = p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0;

                return (
                  <Link
                    key={enrollment.course_id}
                    to={`/courses/${enrollment.course_id}`}
                    className="block rounded-xl border border-slate-800 bg-slate-900/50 p-4 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Course thumbnail */}
                      <div className="h-12 w-18 shrink-0 overflow-hidden rounded-lg border border-slate-800 bg-slate-800">
                        {enrollment.course?.image_url ? (
                          <img
                            src={enrollment.course.image_url}
                            alt={enrollment.course.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-gray-600">
                            <BookOpen className="h-5 w-5" />
                          </div>
                        )}
                      </div>

                      {/* Course info + progress */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-white truncate pr-4">
                            {enrollment.course?.title || 'Unknown course'}
                          </h3>
                          <span className="shrink-0 text-sm font-bold text-purple-400">{percent}%</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">
                          {enrollment.course?.instructor_name}
                        </p>
                        {/* Progress bar */}
                        <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-800">
                          <div
                            className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out ${
                              percent === 100
                                ? 'bg-gradient-to-r from-green-500 to-emerald-400 shadow-[0_0_10px_rgba(34,197,94,0.3)]'
                                : 'bg-gradient-to-r from-purple-600 to-violet-400 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <p className="mt-1 text-[11px] text-gray-600">
                          {p.completed} / {p.total} materials
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent activity — takes 1/3 on large screens */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-white">Recent Activity</h2>

          {recentActivity.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-center">
              <Clock className="mx-auto h-8 w-8 text-gray-600" />
              <p className="mt-2 text-sm text-gray-500">No activity yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((activity) => {
                const Icon = getActivityIcon(activity.fileType);
                return (
                  <div
                    key={activity.materialId}
                    className="rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-green-500/10">
                        <Icon className="h-3.5 w-3.5 text-green-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">{activity.title}</p>
                        <p className="text-xs text-gray-500 truncate">{activity.courseName}</p>
                        <p className="mt-1 text-[11px] text-gray-600">
                          {format(new Date(activity.completedAt), 'MMM d, yyyy · h:mm a')}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * StatCard — a single stat with icon, label, and value.
 */
function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${bg}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
      </div>
    </div>
  );
}

/**
 * Returns the right icon for a completed material based on file type.
 */
function getActivityIcon(fileType) {
  const videoTypes = ['mp4', 'webm', 'mov', 'avi'];
  const docTypes = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt'];

  if (videoTypes.includes(fileType)) return Video;
  if (docTypes.includes(fileType)) return FileText;
  return File;
}
