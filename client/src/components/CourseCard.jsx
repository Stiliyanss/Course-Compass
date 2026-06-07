import { Link } from 'react-router-dom';
import { Clock, User, Heart } from 'lucide-react';
import { isSaleActive, getSalePrice } from '../utils/sale';
import { useAuth } from '../context/AuthContext';
import { useWishlistCheck, useToggleWishlist } from '../hooks/useWishlist';
import SaleCountdown from './SaleCountdown';
import StarRating from './StarRating';

export default function CourseCard({ course }) {
  const { user } = useAuth();
  const { data: isWishlisted } = useWishlistCheck(user ? course.id : null);
  const toggleMutation = useToggleWishlist(course.id);
  return (
    <Link
      to={`/courses/${course.id}`}
      className="group rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden transition-all hover:border-purple-500/40 hover:bg-slate-900"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-800">
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
        {isSaleActive(course) && (
          <span className="absolute top-2 right-2 rounded-full bg-green-500 px-2 py-0.5 text-xs font-bold text-white shadow-lg">
            -{Number(course.discount_percent)}%
          </span>
        )}
        {user && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleMutation.mutate();
            }}
            className="absolute top-2 left-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition-colors hover:bg-black/70"
          >
            <Heart
              className={`h-4 w-4 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-white/70 hover:text-red-400'}`}
            />
          </button>
        )}
      </div>

      {/* Card content */}
      <div className="p-5 space-y-3">
        {/* Category + Title */}
        {course.category && (
          <span className="inline-block rounded-full bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 text-xs font-medium text-purple-300">
            {course.category}
          </span>
        )}
        <h3 className="text-lg font-semibold text-white line-clamp-2 group-hover:text-purple-400 transition-colors">
          {course.title}
        </h3>

        {/* Instructor name */}
        <div className="flex items-center gap-1.5 text-sm text-gray-400">
          <User className="h-3.5 w-3.5" />
          {course.instructor?.full_name || 'Unknown'}
        </div>

        {/* Star rating */}
        {course.avgRating && (
          <StarRating
            rating={Math.round(Number(course.avgRating))}
            showValue
            count={course.reviewCount}
            size="sm"
          />
        )}

        {/* Bottom row: duration + price */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          {course.duration && (
            <div className="flex items-center gap-1.5 text-sm text-gray-400">
              <Clock className="h-3.5 w-3.5" />
              {course.duration}
            </div>
          )}

          {Number(course.price) === 0 ? (
            <span className="text-lg font-bold text-purple-400">Free</span>
          ) : isSaleActive(course) ? (
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 line-through">${Number(course.price).toFixed(2)}</span>
                <span className="text-lg font-bold text-green-400">${getSalePrice(course).toFixed(2)}</span>
              </div>
              <SaleCountdown saleEndsAt={course.sale_ends_at} />
            </div>
          ) : (
            <span className="text-lg font-bold text-purple-400">${Number(course.price).toFixed(2)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
