import { Link } from 'react-router-dom';
import { Clock, User } from 'lucide-react';

export default function CourseCard({ course }) {
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
        {/* Title */}
        <h3 className="text-lg font-semibold text-white line-clamp-2 group-hover:text-purple-400 transition-colors">
          {course.title}
        </h3>

        {/* Instructor name */}
        <div className="flex items-center gap-1.5 text-sm text-gray-400">
          <User className="h-3.5 w-3.5" />
          {course.instructor?.full_name || 'Unknown'}
        </div>

        {/* Bottom row: duration + price */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          {course.duration && (
            <div className="flex items-center gap-1.5 text-sm text-gray-400">
              <Clock className="h-3.5 w-3.5" />
              {course.duration}
            </div>
          )}

          <span className="text-lg font-bold text-purple-400">
            {Number(course.price) === 0 ? 'Free' : `$${Number(course.price).toFixed(2)}`}
          </span>
        </div>
      </div>
    </Link>
  );
}
