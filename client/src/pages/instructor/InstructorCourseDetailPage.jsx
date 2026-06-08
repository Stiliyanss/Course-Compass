import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useInstructorCourseDetail } from '../../hooks/useInstructorCourseDetail';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  ArrowLeft, Users, DollarSign, Star, BarChart3, BookOpen, Clock,
  Pencil, FileText, ChevronDown, ChevronRight, Eye, EyeOff, Archive,
  Calendar, TrendingUp, Layers, MessageSquare, CheckCircle, Circle,
  Video, File,
} from 'lucide-react';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import StarRating from '../../components/StarRating';

export default function InstructorCourseDetailPage() {
  const { id } = useParams();
  const { data, isLoading, isError, error } = useInstructorCourseDetail(id);
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
          Failed to load course: {error.message}
        </div>
      </div>
    );
  }

  const { course, sections, totalMaterials, students, reviews, avgRating, totalRevenue, avgCompletion } = data;

  const statusStyles = {
    draft: { badge: 'bg-gray-400/10 text-gray-400 border-gray-400/30', label: 'Draft' },
    published: { badge: 'bg-green-400/10 text-green-400 border-green-400/30', label: 'Published' },
    archived: { badge: 'bg-amber-400/10 text-amber-400 border-amber-400/30', label: 'Archived' },
  };
  const status = statusStyles[course.status];

  const tabs = [
    { key: 'students', label: 'Students', icon: Users, count: students.length },
    { key: 'reviews', label: 'Reviews', icon: MessageSquare, count: reviews.length },
    { key: 'content', label: 'Content', icon: Layers, count: sections.length },
  ];

  return (
    <div className="p-3 space-y-4 sm:p-6 sm:space-y-6">
      {/* Back link */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Link
          to="/instructor/courses"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to courses
        </Link>
      </motion.div>

      {/* ── Hero banner ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950/30"
      >
        {/* Decorative glow orbs */}
        <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-purple-600/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-blue-600/10 blur-3xl" />

        <div className="relative flex flex-col gap-4 p-5 sm:p-8 lg:flex-row lg:items-center lg:gap-6">
          {/* Thumbnail */}
          <div className="h-32 w-full shrink-0 overflow-hidden rounded-xl border border-slate-800 bg-slate-800 sm:h-40 lg:w-56">
            {course.image_url ? (
              <img src={course.image_url} alt={course.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-600 text-sm">
                No image
              </div>
            )}
          </div>

          {/* Course info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${status.badge}`}>
                {status.label}
              </span>
              {course.category && (
                <span className="inline-block rounded-full bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 text-xs font-medium text-purple-300">
                  {course.category}
                </span>
              )}
            </div>
            <h1
              className="text-xl font-bold text-white sm:text-2xl md:text-3xl truncate"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {course.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Created {format(new Date(course.created_at), 'MMM d, yyyy')}
              </span>
              {course.duration && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {course.duration}
                </span>
              )}
              <span className="font-medium text-purple-400">
                {Number(course.price) === 0 ? 'Free' : `$${Number(course.price).toFixed(2)}`}
              </span>
            </div>
            {/* Action buttons */}
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to={`/instructor/courses/${course.id}/edit`}>
                <Button variant="outline" className="text-xs px-3 py-1.5 gap-1.5">
                  <Pencil className="h-3.5 w-3.5" />
                  Edit Course
                </Button>
              </Link>
              <Link to={`/instructor/courses/${course.id}/content`}>
                <Button variant="outline" className="text-xs px-3 py-1.5 gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  Manage Content
                </Button>
              </Link>
              <Link to={`/courses/${course.id}`}>
                <Button variant="ghost" className="text-xs px-3 py-1.5 gap-1.5">
                  <Eye className="h-3.5 w-3.5" />
                  View Public Page
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Stats cards ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <StatCard
          label="Students"
          value={students.length}
          icon={Users}
          color="text-blue-400"
          bg="bg-blue-400/10"
          delay={0.1}
        />
        <StatCard
          label="Revenue"
          value={`$${totalRevenue.toFixed(2)}`}
          icon={DollarSign}
          color="text-green-400"
          bg="bg-green-400/10"
          delay={0.15}
        />
        <StatCard
          label="Avg Rating"
          value={avgRating || '—'}
          icon={Star}
          color="text-amber-400"
          bg="bg-amber-400/10"
          delay={0.2}
        />
        <StatCard
          label="Avg Completion"
          value={`${avgCompletion}%`}
          icon={TrendingUp}
          color="text-purple-400"
          bg="bg-purple-400/10"
          delay={0.25}
        />
      </div>

      {/* ── Tabs ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="flex gap-1 rounded-xl border border-slate-800 bg-slate-900/50 p-1"
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                : 'text-gray-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className={`rounded-full px-1.5 py-0.5 text-xs ${
              activeTab === tab.key ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-800 text-gray-500'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </motion.div>

      {/* ── Tab content ── */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'students' && <StudentsTab students={students} />}
        {activeTab === 'reviews' && <ReviewsTab reviews={reviews} avgRating={avgRating} />}
        {activeTab === 'content' && <ContentTab sections={sections} totalMaterials={totalMaterials} />}
      </motion.div>
    </div>
  );
}

/* ── Stats Card ── */
function StatCard({ label, value, icon: Icon, color, bg, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="rounded-xl border border-slate-800 bg-slate-900/50 p-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 sm:text-sm">{label}</p>
          <p className={`text-xl font-bold sm:text-2xl ${color}`}>{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bg}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
      </div>
    </motion.div>
  );
}

/* ── Students Tab ── */
function StudentsTab({ students }) {
  if (students.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-12 text-center">
        <Users className="mx-auto h-10 w-10 text-gray-600" />
        <p className="mt-3 text-gray-400">No students enrolled yet</p>
        <p className="mt-1 text-sm text-gray-500">Students will appear here once they enroll</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
      {/* Table header */}
      <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-5 py-3 border-b border-slate-800 text-xs font-medium text-gray-500 uppercase tracking-wider">
        <span className="col-span-4">Student</span>
        <span className="col-span-3">Enrolled</span>
        <span className="col-span-3">Progress</span>
        <span className="col-span-2 text-right">Completion</span>
      </div>

      <div className="divide-y divide-slate-800">
        {students.map((student, i) => (
          <motion.div
            key={student.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.3) }}
            className="flex flex-col gap-3 px-5 py-4 hover:bg-slate-800/30 transition-colors sm:grid sm:grid-cols-12 sm:items-center sm:gap-4"
          >
            {/* Student info */}
            <div className="flex items-center gap-3 sm:col-span-4">
              <div className="h-10 w-10 shrink-0 rounded-full overflow-hidden border border-slate-700 bg-slate-800">
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
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{student.full_name}</p>
                {student.email && (
                  <p className="text-xs text-gray-500 truncate">{student.email}</p>
                )}
              </div>
            </div>

            {/* Enrolled date */}
            <div className="sm:col-span-3">
              <span className="text-sm text-gray-400">
                {format(new Date(student.enrolled_at), 'MMM d, yyyy')}
              </span>
            </div>

            {/* Progress bar */}
            <div className="sm:col-span-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      student.percent === 100
                        ? 'bg-gradient-to-r from-green-600 to-green-400'
                        : 'bg-gradient-to-r from-purple-600 to-purple-400'
                    }`}
                    style={{ width: `${student.percent}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-12">{student.completed}/{student.total}</span>
              </div>
            </div>

            {/* Completion percentage */}
            <div className="sm:col-span-2 sm:text-right">
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                student.percent === 100
                  ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                  : student.percent > 50
                  ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400'
                  : 'bg-slate-800 border border-slate-700 text-gray-400'
              }`}>
                {student.percent}%
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ── Reviews Tab ── */
function ReviewsTab({ reviews, avgRating }) {
  if (reviews.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-12 text-center">
        <MessageSquare className="mx-auto h-10 w-10 text-gray-600" />
        <p className="mt-3 text-gray-400">No reviews yet</p>
        <p className="mt-1 text-sm text-gray-500">Reviews from students will appear here</p>
      </div>
    );
  }

  // Rating distribution
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    percent: Math.round((reviews.filter((r) => r.rating === star).length / reviews.length) * 100),
  }));

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <div className="flex flex-col gap-6 sm:flex-row">
          {/* Big average */}
          <div className="flex flex-col items-center justify-center shrink-0">
            <span className="text-5xl font-bold text-white">{avgRating}</span>
            <StarRating rating={Math.round(Number(avgRating))} size="md" />
            <span className="mt-1 text-sm text-gray-500">{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</span>
          </div>

          {/* Distribution */}
          <div className="flex-1 space-y-2">
            {distribution.map((d) => (
              <div key={d.star} className="flex items-center gap-3">
                <span className="text-sm text-gray-400 w-3">{d.star}</span>
                <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                <div className="flex-1 h-2.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all duration-500"
                    style={{ width: `${d.percent}%` }}
                  />
                </div>
                <span className="text-sm text-gray-500 w-8 text-right">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Review list */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden divide-y divide-slate-800">
        {reviews.map((review, i) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.3) }}
            className="p-5 hover:bg-slate-800/20 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 shrink-0 rounded-full overflow-hidden border border-slate-700 bg-slate-800">
                {review.student_avatar ? (
                  <img src={review.student_avatar} alt={review.student_name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-600/20 to-slate-800">
                    <span className="text-sm font-bold text-purple-300">
                      {review.student_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">{review.student_name}</span>
                  <span className="text-xs text-gray-600">
                    {format(new Date(review.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
                <StarRating rating={review.rating} size="sm" />
                {review.comment && (
                  <p className="mt-2 text-sm text-gray-400 leading-relaxed">{review.comment}</p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ── Content Tab ── */
function ContentTab({ sections, totalMaterials }) {
  if (sections.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-12 text-center">
        <Layers className="mx-auto h-10 w-10 text-gray-600" />
        <p className="mt-3 text-gray-400">No content yet</p>
        <p className="mt-1 text-sm text-gray-500">Add sections and materials to your course</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        {sections.length} {sections.length === 1 ? 'section' : 'sections'} &middot; {totalMaterials} materials
      </p>
      {sections.map((section, i) => (
        <SectionCard key={section.id} section={section} index={i} />
      ))}
    </div>
  );
}

function SectionCard({ section, index }) {
  const [open, setOpen] = useState(false);

  function getMaterialIcon(fileType) {
    const videoTypes = ['mp4', 'webm', 'mov', 'avi'];
    const docTypes = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt'];
    if (videoTypes.includes(fileType)) return Video;
    if (docTypes.includes(fileType)) return FileText;
    return File;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.08, 0.4) }}
      className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-3.5 text-left hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {open ? (
            <ChevronDown className="h-4 w-4 text-purple-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-500" />
          )}
          <span className="font-medium text-white">{section.title}</span>
        </div>
        <span className="text-xs text-gray-500">
          {section.materials.length} {section.materials.length === 1 ? 'material' : 'materials'}
        </span>
      </button>

      {open && section.materials.length > 0 && (
        <div className="border-t border-slate-800 px-5 py-2">
          {section.materials.map((mat) => {
            const Icon = getMaterialIcon(mat.file_type);
            return (
              <div key={mat.id} className="flex items-center gap-3 py-2 text-sm text-gray-400">
                <Icon className="h-4 w-4 shrink-0 text-gray-500" />
                <span>{mat.title}</span>
                <span className="ml-auto text-xs text-gray-600 uppercase">{mat.file_type}</span>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
