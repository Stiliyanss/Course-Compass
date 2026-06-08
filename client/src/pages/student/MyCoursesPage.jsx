import { Link } from 'react-router-dom';
import { useMyEnrollments } from '../../hooks/useEnrollments';
import { BookOpen, Clock, User, Search, GraduationCap, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
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
    <div className="p-3 space-y-4 sm:p-6 sm:space-y-8">
      {/* ── Hero banner ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950/30 p-5 sm:p-8"
      >
        {/* Decorative glow orbs */}
        <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-purple-600/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-blue-600/10 blur-3xl" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mb-2 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-300"
            >
              <GraduationCap className="h-3 w-3" />
              My Learning
            </motion.div>
            <h1
              className="text-2xl font-bold text-white sm:text-3xl"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              My Courses
            </h1>
            <p className="mt-1 text-sm text-gray-400 sm:text-base">
              Courses you are enrolled in
            </p>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex gap-3"
          >
            <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/20">
                <BookOpen className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{enrollments?.length || 0}</p>
                <p className="text-xs text-gray-500">Enrolled</p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Course list */}
      {enrollments.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="rounded-xl border border-slate-800 bg-slate-900/50 p-12 text-center"
        >
          <BookOpen className="mx-auto h-10 w-10 text-gray-600" />
          <p className="mt-3 text-gray-400">You haven't enrolled in any courses yet</p>
          <p className="mt-1 text-sm text-gray-500">Explore our catalog and find something you love</p>
          <Link to="/courses" className="mt-5 inline-block">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button>
                <Search className="mr-2 h-4 w-4" />
                Browse Courses
              </Button>
            </motion.div>
          </Link>
        </motion.div>
      ) : (
        <>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="text-sm text-gray-500"
          >
            {enrollments.length} {enrollments.length === 1 ? 'course' : 'courses'} in your library
          </motion.p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {enrollments.map((enrollment, i) => (
              <motion.div
                key={enrollment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: Math.min(i * 0.08, 0.5), ease: 'easeOut' }}
                whileHover={{ y: -4 }}
              >
                <EnrollmentCard enrollment={enrollment} />
              </motion.div>
            ))}
          </div>

          {/* Discover more link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="text-center pt-2"
          >
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              Discover more courses
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </>
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
