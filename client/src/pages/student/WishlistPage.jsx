import { Link } from 'react-router-dom';
import { useMyWishlist } from '../../hooks/useWishlist';
import { Heart, Search } from 'lucide-react';
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
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-2xl font-bold text-white md:text-3xl"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          My Wishlist
        </h1>
        <p className="mt-1 text-gray-400">
          Courses you've saved for later
        </p>
      </div>

      {/* Course list */}
      {courses.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-12 text-center">
          <Heart className="mx-auto h-10 w-10 text-gray-600" />
          <p className="mt-3 text-gray-400">Your wishlist is empty</p>
          <Link to="/courses" className="mt-4 inline-block">
            <Button>
              <Search className="mr-2 h-4 w-4" />
              Browse Courses
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
