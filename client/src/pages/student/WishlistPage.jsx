import { Link } from 'react-router-dom';
import { useMyWishlist } from '../../hooks/useWishlist';
import { Heart, Search, BookOpen, Sparkles } from 'lucide-react';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import CourseCard from '../../components/CourseCard';

export default function WishlistPage() {
  const { data: courses, isLoading, isError, error } = useMyWishlist();

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
          Failed to load wishlist: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-4 sm:p-6 sm:space-y-8">
      {/* ── Hero banner ── */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-red-950/30 p-5 sm:p-8">
        {/* Decorative glow orbs */}
        <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-red-600/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-purple-600/10 blur-3xl" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-300">
              <Heart className="h-3 w-3 fill-red-300" />
              My Wishlist
            </div>
            <h1
              className="text-2xl font-bold text-white sm:text-3xl"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Saved Courses
            </h1>
            <p className="mt-1 text-sm text-gray-400 sm:text-base">
              Courses you've saved for later
            </p>
          </div>

          {/* Stats */}
          <div className="flex gap-3">
            <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20">
                <Heart className="h-5 w-5 text-red-400 fill-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{courses.length}</p>
                <p className="text-xs text-gray-500">{courses.length === 1 ? 'Course' : 'Courses'} saved</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Course grid or empty state ── */}
      {courses.length === 0 ? (
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-12 text-center">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 h-40 w-40 rounded-full bg-red-600/5 blur-3xl" />
          <div className="relative">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
              <Heart className="h-10 w-10 text-red-400/50" />
            </div>
            <h3
              className="mt-5 text-xl font-semibold text-white"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Your wishlist is empty
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-gray-400">
              Browse our course catalog and click the heart icon on any course to save it here for later.
            </p>
            <Link to="/courses" className="mt-6 inline-block">
              <Button>
                <Search className="mr-2 h-4 w-4" />
                Browse Courses
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-white sm:text-lg">
              All Saved Courses
            </h2>
            <Link
              to="/courses"
              className="flex items-center gap-1.5 text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Discover more
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
