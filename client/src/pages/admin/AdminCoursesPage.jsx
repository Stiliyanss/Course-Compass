import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAllCoursesAdmin, useDeleteCourse, useUpdateCourse } from '../../hooks/useCourses';
import {
  BookOpen,
  Globe,
  FileEdit,
  Archive,
  Calendar,
  Search,
  ChevronDown,
  Users,
  Trash2,
  Eye,
  DollarSign,
} from 'lucide-react';
import { format } from 'date-fns';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

export default function AdminCoursesPage() {
  const { data: courses, isLoading, isError, error } = useAllCoursesAdmin();
  const deleteMutation = useDeleteCourse();
  const updateMutation = useUpdateCourse();

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  function handleDelete(id) {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success('Course deleted');
        setConfirmDeleteId(null);
      },
      onError: (err) => toast.error(err.message),
    });
  }

  function handleStatusChange(id, newStatus) {
    updateMutation.mutate(
      { id, status: newStatus },
      {
        onSuccess: () => toast.success(`Course ${newStatus}`),
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
          Failed to load courses: {error.message}
        </div>
      </div>
    );
  }

  const published = courses.filter((c) => c.status === 'published').length;
  const draft = courses.filter((c) => c.status === 'draft').length;
  const archived = courses.filter((c) => c.status === 'archived').length;

  // Apply filters
  const filtered = courses.filter((course) => {
    if (statusFilter !== 'all' && course.status !== statusFilter) return false;
    if (search) {
      const term = search.toLowerCase();
      return (
        course.title?.toLowerCase().includes(term) ||
        course.instructor?.full_name?.toLowerCase().includes(term)
      );
    }
    return true;
  });

  return (
    <div className="p-3 sm:p-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1
          className="text-2xl font-bold text-white md:text-3xl"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Manage Courses
        </h1>
        <p className="mt-1 text-gray-400">
          View all courses and manage their status
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-2 sm:mb-8 sm:gap-4">
        <StatCard
          label="Published"
          count={published}
          icon={Globe}
          color="text-green-400"
          bg="bg-green-400/10"
        />
        <StatCard
          label="Draft"
          count={draft}
          icon={FileEdit}
          color="text-amber-400"
          bg="bg-amber-400/10"
        />
        <StatCard
          label="Archived"
          count={archived}
          icon={Archive}
          color="text-gray-400"
          bg="bg-gray-400/10"
        />
      </div>

      {/* Filters row */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or instructor..."
            className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none rounded-lg border border-slate-700 bg-slate-800 py-2 pl-4 pr-10 text-sm text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        </div>
      </div>

      {/* Courses list */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-12 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-gray-600" />
          <p className="mt-3 text-gray-400">No courses found</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-xl border border-slate-800 md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Instructor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Students
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((course) => (
                  <tr key={course.id} className="bg-slate-900/30 hover:bg-slate-900/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {course.image_url ? (
                          <img
                            src={course.image_url}
                            alt={course.title}
                            className="h-10 w-16 rounded-lg object-cover border border-slate-700"
                          />
                        ) : (
                          <div className="flex h-10 w-16 items-center justify-center rounded-lg bg-purple-600/20 border border-slate-700">
                            <BookOpen className="h-4 w-4 text-purple-400" />
                          </div>
                        )}
                        <p className="font-medium text-white max-w-[200px] truncate">{course.title}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-300">{course.instructor?.full_name || 'Unknown'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={course.status} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-300">
                        {Number(course.price) === 0 ? 'Free' : `$${Number(course.price).toFixed(2)}`}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-400">
                        <Users className="h-3.5 w-3.5" />
                        {course.enrollmentCount}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-400">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(course.created_at), 'MMM d, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <CourseActions
                        course={course}
                        confirmDeleteId={confirmDeleteId}
                        setConfirmDeleteId={setConfirmDeleteId}
                        onDelete={handleDelete}
                        onStatusChange={handleStatusChange}
                        isDeleting={deleteMutation.isPending}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {filtered.map((course) => (
              <div key={course.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <div className="flex items-start gap-3">
                  {course.image_url ? (
                    <img
                      src={course.image_url}
                      alt={course.title}
                      className="h-12 w-18 rounded-lg object-cover border border-slate-700 shrink-0"
                    />
                  ) : (
                    <div className="flex h-12 w-18 items-center justify-center rounded-lg bg-purple-600/20 border border-slate-700 shrink-0">
                      <BookOpen className="h-4 w-4 text-purple-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white truncate">{course.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">by {course.instructor?.full_name || 'Unknown'}</p>
                  </div>
                  <StatusBadge status={course.status} />
                </div>

                <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {Number(course.price) === 0 ? 'Free' : `$${Number(course.price).toFixed(2)}`}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {course.enrollmentCount} students
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(course.created_at), 'MMM d, yyyy')}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-end gap-2">
                  <CourseActions
                    course={course}
                    confirmDeleteId={confirmDeleteId}
                    setConfirmDeleteId={setConfirmDeleteId}
                    onDelete={handleDelete}
                    onStatusChange={handleStatusChange}
                    isDeleting={deleteMutation.isPending}
                    mobile
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CourseActions({ course, confirmDeleteId, setConfirmDeleteId, onDelete, onStatusChange, isDeleting, mobile }) {
  const btnClass = mobile ? 'text-xs px-2 py-1' : 'text-xs px-3 py-1';

  if (confirmDeleteId === course.id) {
    return (
      <div className="inline-flex items-center gap-2">
        <span className="text-xs text-gray-400">Delete?</span>
        <Button
          variant="danger"
          onClick={() => onDelete(course.id)}
          loading={isDeleting}
          className={btnClass}
        >
          Yes
        </Button>
        <Button
          variant="ghost"
          onClick={() => setConfirmDeleteId(null)}
          className={btnClass}
        >
          No
        </Button>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5">
      <Link to={`/courses/${course.id}`}>
        <button className="rounded-lg p-1.5 text-gray-400 hover:text-purple-400 hover:bg-slate-800 transition-colors">
          <Eye className="h-3.5 w-3.5" />
        </button>
      </Link>

      {course.status === 'published' && (
        <button
          onClick={() => onStatusChange(course.id, 'archived')}
          className="rounded-lg p-1.5 text-gray-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
          title="Archive"
        >
          <Archive className="h-3.5 w-3.5" />
        </button>
      )}

      {course.status === 'archived' && (
        <button
          onClick={() => onStatusChange(course.id, 'published')}
          className="rounded-lg p-1.5 text-gray-400 hover:text-green-400 hover:bg-slate-800 transition-colors"
          title="Publish"
        >
          <Globe className="h-3.5 w-3.5" />
        </button>
      )}

      {course.status === 'draft' && (
        <button
          onClick={() => onStatusChange(course.id, 'published')}
          className="rounded-lg p-1.5 text-gray-400 hover:text-green-400 hover:bg-slate-800 transition-colors"
          title="Publish"
        >
          <Globe className="h-3.5 w-3.5" />
        </button>
      )}

      <button
        onClick={() => setConfirmDeleteId(course.id)}
        className="rounded-lg p-1.5 text-gray-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
        title="Delete"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
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

function StatusBadge({ status }) {
  const styles = {
    published: 'bg-green-400/10 text-green-400 border-green-400/30',
    draft: 'bg-amber-400/10 text-amber-400 border-amber-400/30',
    archived: 'bg-gray-400/10 text-gray-400 border-gray-400/30',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
