import { Link } from 'react-router-dom';
import { useMyEnrollments } from '../../hooks/useEnrollments';
import { BookOpen, Clock, User, Search } from 'lucide-react';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';

export default function MyCoursesPage() {
  const { data: enrollments, isLoading, isError, error } = useMyEnrollments();

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
      <div className="mb-8">
        <h1
          className="text-2xl font-bold text-white md:text-3xl"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          My Courses
        </h1>
        <p className="mt-1 text-gray-400">
          Courses you are enrolled in
        </p>
      </div>

      {/* Course list */}
      {enrollments.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-12 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-gray-600" />
          <p className="mt-3 text-gray-400">You haven't enrolled in any courses yet</p>
          <Link to="/courses" className="mt-4 inline-block">
            <Button>
              <Search className="mr-2 h-4 w-4" />
              Browse Courses
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {enrollments.map((enrollment) => (
            <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
          ))}
        </div>
      )}
    </div>
  );
}

function EnrollmentCard({ enrollment }) {
  const { course } = enrollment;

  if (!course) return null;

  return (
    <Link
      to={`/courses/${course.id}`}
      className="group rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden transition-all hover:border-purple-500/40 hover:bg-slate-900"
    >
      {/* Thumbnail */}
      <div className="aspect-video w-full overflow-hidden bg-slate-800">
        {course.image_url ? (
          <img
            src={course.image_url}
            alt={course.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-600 text-sm">
            No image
          </div>
        )}
      </div>

      {/* Card content */}
      <div className="p-5 space-y-3">
        <h3 className="text-lg font-semibold text-white line-clamp-2 group-hover:text-purple-400 transition-colors">
          {course.title}
        </h3>

        <div className="flex items-center gap-1.5 text-sm text-gray-400">
          <User className="h-3.5 w-3.5" />
          {course.instructor?.full_name || 'Unknown'}
        </div>

        {course.duration && (
          <div className="flex items-center gap-1.5 text-sm text-gray-400">
            <Clock className="h-3.5 w-3.5" />
            {course.duration}
          </div>
        )}

        {/* Payment status */}
        <div className="pt-2 border-t border-slate-800">
          <PaymentBadge status={enrollment.payment_status} />
        </div>
      </div>
    </Link>
  );
}

function PaymentBadge({ status }) {
  const styles = {
    completed: 'bg-green-400/10 text-green-400 border-green-400/30',
    pending: 'bg-amber-400/10 text-amber-400 border-amber-400/30',
    failed: 'bg-red-400/10 text-red-400 border-red-400/30',
  };

  const labels = {
    completed: 'Enrolled',
    pending: 'Payment Pending',
    failed: 'Payment Failed',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
