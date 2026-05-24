import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useInstructorCourses, useDeleteCourse, useUpdateCourse } from '../../hooks/useCourses';
import { useCourseEnrollments } from '../../hooks/useEnrollments';
import { Plus, Pencil, Trash2, Eye, EyeOff, Archive, BookOpen, Calendar, FileText, Users, X } from 'lucide-react';
import { format } from 'date-fns';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

export default function ManageCoursesPage() {
  const { data: courses, isLoading, isError, error } = useInstructorCourses();
  const deleteMutation = useDeleteCourse();
  const updateMutation = useUpdateCourse();

  const courseIds = courses?.map((c) => c.id) || [];
  const { data: enrollmentData } = useCourseEnrollments(courseIds);

  // Track which course has the delete confirmation open
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  // Track which course's student list modal is open
  const [studentModalCourseId, setStudentModalCourseId] = useState(null);

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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-white md:text-3xl"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Manage Courses
          </h1>
          <p className="mt-1 text-gray-400">
            Create and manage your courses
          </p>
        </div>
        <Link to="/instructor/courses/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Course
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <StatCard
          label="Draft"
          count={courses.filter((c) => c.status === 'draft').length}
          icon={Pencil}
          color="text-gray-400"
          bg="bg-gray-400/10"
        />
        <StatCard
          label="Published"
          count={courses.filter((c) => c.status === 'published').length}
          icon={Eye}
          color="text-green-400"
          bg="bg-green-400/10"
        />
        <StatCard
          label="Archived"
          count={courses.filter((c) => c.status === 'archived').length}
          icon={Archive}
          color="text-amber-400"
          bg="bg-amber-400/10"
        />
      </div>

      {/* Courses list */}
      {courses.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-12 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-gray-600" />
          <p className="mt-3 text-gray-400">No courses yet</p>
          <Link to="/instructor/courses/new" className="mt-4 inline-block">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create your first course
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map((course) => (
            <CourseRow
              key={course.id}
              course={course}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              confirmDeleteId={confirmDeleteId}
              setConfirmDeleteId={setConfirmDeleteId}
              isDeleting={deleteMutation.isPending}
              isUpdating={updateMutation.isPending}
              studentCount={enrollmentData?.[course.id]?.count || 0}
              onViewStudents={() => setStudentModalCourseId(course.id)}
            />
          ))}
        </div>
      )}

      {/* Student list modal */}
      {studentModalCourseId && (
        <StudentListModal
          courseName={courses.find((c) => c.id === studentModalCourseId)?.title}
          students={enrollmentData?.[studentModalCourseId]?.students || []}
          onClose={() => setStudentModalCourseId(null)}
        />
      )}
    </div>
  );
}

function CourseRow({
  course,
  onStatusChange,
  onDelete,
  confirmDeleteId,
  setConfirmDeleteId,
  isDeleting,
  isUpdating,
  studentCount,
  onViewStudents,
}) {
  const statusStyles = {
    draft: { badge: 'bg-gray-400/10 text-gray-400 border-gray-400/30', label: 'Draft' },
    published: { badge: 'bg-green-400/10 text-green-400 border-green-400/30', label: 'Published' },
    archived: { badge: 'bg-amber-400/10 text-amber-400 border-amber-400/30', label: 'Archived' },
  };

  const style = statusStyles[course.status];

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
        {/* Left — course info */}
        <div className="flex items-center gap-4 min-w-0">
          {/* Thumbnail */}
          <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-slate-800 bg-slate-800">
            {course.image_url ? (
              <img src={course.image_url} alt={course.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-gray-600">
                No image
              </div>
            )}
          </div>

          <div className="min-w-0">
            <h3 className="font-semibold text-white truncate">{course.title}</h3>
            <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${style.badge}`}>
                {style.label}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(course.created_at), 'MMM d, yyyy')}
              </span>
              <span className="font-medium text-purple-400">
                {Number(course.price) === 0 ? 'Free' : `$${Number(course.price).toFixed(2)}`}
              </span>
              <button
                onClick={onViewStudents}
                className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
              >
                <Users className="h-3 w-3" />
                {studentCount} {studentCount === 1 ? 'student' : 'students'}
              </button>
            </div>
          </div>
        </div>

        {/* Right — actions */}
        <div className="flex items-center gap-2">
          {/* Status toggle buttons */}
          {course.status === 'draft' && (
            <Button
              variant="outline"
              onClick={() => onStatusChange(course.id, 'published')}
              loading={isUpdating}
              className="text-xs px-3 py-1 gap-1.5"
            >
              <Eye className="h-3.5 w-3.5" />
              Publish
            </Button>
          )}
          {course.status === 'published' && (
            <Button
              variant="outline"
              onClick={() => onStatusChange(course.id, 'archived')}
              loading={isUpdating}
              className="text-xs px-3 py-1 gap-1.5"
            >
              <EyeOff className="h-3.5 w-3.5" />
              Archive
            </Button>
          )}
          {course.status === 'archived' && (
            <Button
              variant="outline"
              onClick={() => onStatusChange(course.id, 'published')}
              loading={isUpdating}
              className="text-xs px-3 py-1 gap-1.5"
            >
              <Eye className="h-3.5 w-3.5" />
              Republish
            </Button>
          )}

          {/* Content (sections & materials) */}
          <Link to={`/instructor/courses/${course.id}/content`}>
            <Button variant="ghost" className="text-xs px-3 py-1 gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Content
            </Button>
          </Link>

          {/* Edit */}
          <Link to={`/instructor/courses/${course.id}/edit`}>
            <Button variant="ghost" className="text-xs px-3 py-1 gap-1.5">
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          </Link>

          {/* Delete */}
          {confirmDeleteId === course.id ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Delete?</span>
              <Button
                variant="danger"
                onClick={() => onDelete(course.id)}
                loading={isDeleting}
                className="text-xs px-3 py-1"
              >
                Yes
              </Button>
              <Button
                variant="ghost"
                onClick={() => setConfirmDeleteId(null)}
                className="text-xs px-3 py-1"
              >
                No
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              onClick={() => setConfirmDeleteId(course.id)}
              className="text-xs px-3 py-1 text-red-400 hover:text-red-300"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function StudentListModal({ courseName, students, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-md max-h-[80vh] overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Enrolled Students</h3>
            <p className="text-sm text-gray-400 truncate">{courseName}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Student list */}
        <div className="overflow-y-auto max-h-[60vh] p-4">
          {students.length === 0 ? (
            <div className="py-8 text-center">
              <Users className="mx-auto h-8 w-8 text-gray-600" />
              <p className="mt-2 text-sm text-gray-500">No students enrolled yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-800/30 px-4 py-3 hover:bg-slate-800/60 transition-colors"
                >
                  {/* Avatar */}
                  <div className="h-9 w-9 shrink-0 rounded-full overflow-hidden border border-slate-700 bg-slate-800">
                    {student.avatar_url ? (
                      <img src={student.avatar_url} alt={student.full_name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-600/20 to-slate-800">
                        <span className="text-sm font-bold text-purple-300">
                          {student.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">{student.full_name}</p>
                    <p className="text-xs text-gray-500">
                      Enrolled {format(new Date(student.enrolled_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 px-6 py-3">
          <p className="text-xs text-gray-500 text-center">
            {students.length} {students.length === 1 ? 'student' : 'students'} enrolled
          </p>
        </div>
      </div>
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
