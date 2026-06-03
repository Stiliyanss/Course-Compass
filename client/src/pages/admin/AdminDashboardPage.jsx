import { useState } from 'react';
import { useAdminDashboard } from '../../hooks/useAdminDashboard';
import { useAuth } from '../../context/AuthContext';
import { Users, BookOpen, DollarSign, GraduationCap, Sparkles, UserX, TrendingUp, Star, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Highcharts from 'highcharts';
import { HighchartsReact } from 'highcharts-react-official';
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

  const { totalUsers, totalCourses, totalRevenue, totalEnrollments,
          totalStudents, activeStudents, inactiveStudents, avgCompletionRate,
          mostPopularCourses, enrollmentsPerMonth, registrationsPerMonth,
          enrollmentDistribution, topStudents, mostActiveRecently,
          totalInstructors, topInstructors, revenuePerMonth, coursesByStatus,
          topInstructorsByStudents, topRatedInstructors, bestSellingCourses,
          avgCoursePrice, pendingApplications } = data;

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

      {/* ── Tab content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
        >
      {activeTab === 'students' && (
        <div className="space-y-6">
          {/* Student stat cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Total Students</span>
                <div className="rounded-lg border p-2 bg-blue-500/10 text-blue-400 border-blue-500/20">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-white">{totalStudents}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Active Students</span>
                <div className="rounded-lg border p-2 bg-green-500/10 text-green-400 border-green-500/20">
                  <GraduationCap className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-white">{activeStudents}</p>
              <p className="mt-1 text-xs text-gray-500">With at least one enrollment</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Inactive Students</span>
                <div className="rounded-lg border p-2 bg-red-500/10 text-red-400 border-red-500/20">
                  <UserX className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-white">{inactiveStudents}</p>
              <p className="mt-1 text-xs text-gray-500">Never enrolled in a course</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Avg Completion</span>
                <div className="rounded-lg border p-2 bg-amber-500/10 text-amber-400 border-amber-500/20">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-white">{avgCompletionRate}%</p>
              <p className="mt-1 text-xs text-gray-500">Avg materials completed per course</p>
            </div>
          </div>

          {/* Charts — 2 columns */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* New Registrations Over Time */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <h3 className="mb-4 text-sm font-medium text-gray-400">New Registrations</h3>
              <HighchartsReact
                highcharts={Highcharts}
                options={{
                  chart: { type: 'line', backgroundColor: 'transparent', height: 260 },
                  title: { text: '' },
                  xAxis: {
                    categories: registrationsPerMonth.map((r) => r.month),
                    labels: { style: { color: '#9ca3af' } },
                  },
                  yAxis: {
                    title: { text: '' },
                    labels: { style: { color: '#9ca3af' } },
                    gridLineColor: '#1e293b',
                    allowDecimals: false,
                  },
                  legend: { enabled: false },
                  series: [{
                    name: 'Registrations',
                    data: registrationsPerMonth.map((r) => r.count),
                    color: '#34d399',
                    marker: { fillColor: '#34d399', radius: 4 },
                  }],
                  credits: { enabled: false },
                }}
              />
            </div>

            {/* Enrollments Over Time */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <h3 className="mb-4 text-sm font-medium text-gray-400">Enrollments Over Time</h3>
              <HighchartsReact
                highcharts={Highcharts}
                options={{
                  chart: { type: 'column', backgroundColor: 'transparent', height: 260 },
                  title: { text: '' },
                  xAxis: {
                    categories: enrollmentsPerMonth.map((e) => e.month),
                    labels: { style: { color: '#9ca3af' } },
                  },
                  yAxis: {
                    title: { text: '' },
                    labels: { style: { color: '#9ca3af' } },
                    gridLineColor: '#1e293b',
                    allowDecimals: false,
                  },
                  legend: { enabled: false },
                  series: [{
                    name: 'Enrollments',
                    data: enrollmentsPerMonth.map((e) => e.count),
                    color: '#60a5fa',
                  }],
                  credits: { enabled: false },
                }}
              />
            </div>

            {/* Most Popular Courses */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <h3 className="mb-4 text-sm font-medium text-gray-400">Most Popular Courses</h3>
              <HighchartsReact
                highcharts={Highcharts}
                options={{
                  chart: { type: 'bar', backgroundColor: 'transparent', height: 260 },
                  title: { text: '' },
                  xAxis: {
                    categories: mostPopularCourses.map((c) => c.title),
                    labels: { style: { color: '#9ca3af', fontSize: '11px' } },
                  },
                  yAxis: {
                    title: { text: '' },
                    labels: { style: { color: '#9ca3af' } },
                    gridLineColor: '#1e293b',
                    allowDecimals: false,
                  },
                  legend: { enabled: false },
                  tooltip: { valueSuffix: ' students' },
                  series: [{
                    name: 'Enrollments',
                    data: mostPopularCourses.map((c) => c.enrollments),
                    color: '#a78bfa',
                  }],
                  credits: { enabled: false },
                }}
              />
            </div>

            {/* Enrollment Distribution */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <h3 className="mb-4 text-sm font-medium text-gray-400">Enrollment Distribution</h3>
              <HighchartsReact
                highcharts={Highcharts}
                options={{
                  chart: { type: 'column', backgroundColor: 'transparent', height: 260 },
                  title: { text: '' },
                  xAxis: {
                    categories: enrollmentDistribution.map((d) => d.label),
                    labels: { style: { color: '#9ca3af' } },
                  },
                  yAxis: {
                    title: { text: '' },
                    labels: { style: { color: '#9ca3af' } },
                    gridLineColor: '#1e293b',
                    allowDecimals: false,
                  },
                  legend: { enabled: false },
                  tooltip: { valueSuffix: ' students' },
                  series: [{
                    name: 'Students',
                    data: enrollmentDistribution.map((d) => d.count),
                    color: '#fbbf24',
                  }],
                  credits: { enabled: false },
                }}
              />
            </div>

            {/* Top Students */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <h3 className="mb-4 text-sm font-medium text-gray-400">Top Students</h3>
              {topStudents.length === 0 ? (
                <p className="text-sm text-gray-500">No student activity yet</p>
              ) : (
                <div className="space-y-3">
                  {topStudents.map((s, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2">
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-400">
                          {i + 1}
                        </span>
                        <span className="text-sm text-white">{s.name}</span>
                      </div>
                      <div className="flex gap-4 text-xs text-gray-400">
                        <span>{s.enrollments} courses</span>
                        <span>{s.materialsCompleted} completed</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Most Active Recently */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <h3 className="mb-4 text-sm font-medium text-gray-400">Most Active (Last 30 Days)</h3>
              {mostActiveRecently.length === 0 ? (
                <p className="text-sm text-gray-500">No recent activity</p>
              ) : (
                <div className="space-y-3">
                  {mostActiveRecently.map((s, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2">
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/20 text-xs font-bold text-green-400">
                          {i + 1}
                        </span>
                        <span className="text-sm text-white">{s.name}</span>
                      </div>
                      <span className="text-xs text-gray-400">{s.completions} materials completed</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'instructors' && (
        <div className="space-y-6">
          {/* Instructor stat cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Total Instructors</span>
                <div className="rounded-lg border p-2 bg-purple-500/10 text-purple-400 border-purple-500/20">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-white">{totalInstructors}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Avg Course Price</span>
                <div className="rounded-lg border p-2 bg-green-500/10 text-green-400 border-green-500/20">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-white">${avgCoursePrice.toFixed(2)}</p>
              <p className="mt-1 text-xs text-gray-500">Across all paid courses</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Pending Applications</span>
                <div className="rounded-lg border p-2 bg-amber-500/10 text-amber-400 border-amber-500/20">
                  <ClipboardList className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-white">{pendingApplications}</p>
              <p className="mt-1 text-xs text-gray-500">Awaiting review</p>
            </div>
          </div>

          {/* Charts — 2 columns */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top Instructors by Revenue */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <h3 className="mb-4 text-sm font-medium text-gray-400">Top Instructors by Revenue</h3>
              <HighchartsReact
                highcharts={Highcharts}
                options={{
                  chart: { type: 'bar', backgroundColor: 'transparent', height: 260 },
                  title: { text: '' },
                  xAxis: {
                    categories: topInstructors.map((i) => i.name),
                    labels: { style: { color: '#9ca3af', fontSize: '11px' } },
                  },
                  yAxis: {
                    title: { text: '' },
                    labels: { style: { color: '#9ca3af' }, format: '${value}' },
                    gridLineColor: '#1e293b',
                  },
                  legend: { enabled: false },
                  tooltip: { valuePrefix: '$' },
                  series: [{
                    name: 'Revenue',
                    data: topInstructors.map((i) => i.revenue),
                    color: '#a78bfa',
                  }],
                  credits: { enabled: false },
                }}
              />
            </div>

            {/* Top Instructors by Students */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <h3 className="mb-4 text-sm font-medium text-gray-400">Top Instructors by Students</h3>
              <HighchartsReact
                highcharts={Highcharts}
                options={{
                  chart: { type: 'bar', backgroundColor: 'transparent', height: 260 },
                  title: { text: '' },
                  xAxis: {
                    categories: topInstructorsByStudents.map((i) => i.name),
                    labels: { style: { color: '#9ca3af', fontSize: '11px' } },
                  },
                  yAxis: {
                    title: { text: '' },
                    labels: { style: { color: '#9ca3af' } },
                    gridLineColor: '#1e293b',
                    allowDecimals: false,
                  },
                  legend: { enabled: false },
                  tooltip: { valueSuffix: ' students' },
                  series: [{
                    name: 'Students',
                    data: topInstructorsByStudents.map((i) => i.students),
                    color: '#60a5fa',
                  }],
                  credits: { enabled: false },
                }}
              />
            </div>

            {/* Revenue Over Time */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <h3 className="mb-4 text-sm font-medium text-gray-400">Revenue Over Time</h3>
              <HighchartsReact
                highcharts={Highcharts}
                options={{
                  chart: { type: 'column', backgroundColor: 'transparent', height: 260 },
                  title: { text: '' },
                  xAxis: {
                    categories: revenuePerMonth.map((r) => r.month),
                    labels: { style: { color: '#9ca3af' } },
                  },
                  yAxis: {
                    title: { text: '' },
                    labels: { style: { color: '#9ca3af' }, format: '${value}' },
                    gridLineColor: '#1e293b',
                  },
                  legend: { enabled: false },
                  tooltip: { valuePrefix: '$' },
                  series: [{
                    name: 'Revenue',
                    data: revenuePerMonth.map((r) => r.total),
                    color: '#fbbf24',
                  }],
                  credits: { enabled: false },
                }}
              />
            </div>

            {/* Best Selling Courses */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <h3 className="mb-4 text-sm font-medium text-gray-400">Best Selling Courses</h3>
              <HighchartsReact
                highcharts={Highcharts}
                options={{
                  chart: { type: 'bar', backgroundColor: 'transparent', height: 260 },
                  title: { text: '' },
                  xAxis: {
                    categories: bestSellingCourses.map((c) => c.title),
                    labels: { style: { color: '#9ca3af', fontSize: '11px' } },
                  },
                  yAxis: {
                    title: { text: '' },
                    labels: { style: { color: '#9ca3af' }, format: '${value}' },
                    gridLineColor: '#1e293b',
                  },
                  legend: { enabled: false },
                  tooltip: { valuePrefix: '$' },
                  series: [{
                    name: 'Revenue',
                    data: bestSellingCourses.map((c) => c.revenue),
                    color: '#34d399',
                  }],
                  credits: { enabled: false },
                }}
              />
            </div>

            {/* Top Rated Instructors */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <h3 className="mb-4 text-sm font-medium text-gray-400">Top Rated Instructors</h3>
              {topRatedInstructors.length === 0 ? (
                <p className="text-sm text-gray-500">No reviews yet</p>
              ) : (
                <div className="space-y-3">
                  {topRatedInstructors.map((inst, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2">
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-400">
                          {i + 1}
                        </span>
                        <span className="text-sm text-white">{inst.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-medium text-white">{inst.avgRating}</span>
                        <span className="text-xs text-gray-500">({inst.reviewCount} reviews)</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Courses by Status */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <h3 className="mb-4 text-sm font-medium text-gray-400">Courses by Status</h3>
              <HighchartsReact
                highcharts={Highcharts}
                options={{
                  chart: { type: 'pie', backgroundColor: 'transparent', height: 260 },
                  title: { text: '' },
                  plotOptions: {
                    pie: {
                      borderWidth: 0,
                      dataLabels: {
                        enabled: true,
                        format: '{point.name}: {point.y}',
                        style: { color: '#9ca3af', textOutline: 'none', fontSize: '12px' },
                      },
                    },
                  },
                  series: [{
                    name: 'Courses',
                    data: [
                      { name: 'Published', y: coursesByStatus.published, color: '#34d399' },
                      { name: 'Draft',     y: coursesByStatus.draft,     color: '#fbbf24' },
                      { name: 'Archived',  y: coursesByStatus.archived,  color: '#f87171' },
                    ],
                  }],
                  credits: { enabled: false },
                }}
              />
            </div>
          </div>
        </div>
      )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
