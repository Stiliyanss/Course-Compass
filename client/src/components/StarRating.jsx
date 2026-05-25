import { useState } from 'react';
import { Star } from 'lucide-react';

/**
 * StarRating — reusable star display/input component.
 *
 * Props:
 *   rating      — current rating value (1-5)
 *   onChange     — callback when a star is clicked (enables interactive mode)
 *   size         — 'sm' | 'md' | 'lg' (default: 'md')
 *   showValue    — show the numeric value next to the stars (default: false)
 *   count        — review count to display, e.g. "(24)" (optional)
 */
export default function StarRating({ rating = 0, onChange, size = 'md', showValue = false, count }) {
  // hoverValue tracks which star the user is hovering over.
  // Only used when onChange is provided (interactive mode).
  const [hoverValue, setHoverValue] = useState(0);

  const interactive = !!onChange;

  const sizeClasses = {
    sm: 'h-3.5 w-3.5',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const starSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div className="flex items-center gap-1">
      {/* Render 5 stars */}
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((value) => {
          // Determine if this star should be filled:
          // - In interactive mode, use hoverValue while hovering, otherwise the rating
          // - In display mode, just use the rating
          const activeValue = interactive && hoverValue > 0 ? hoverValue : rating;
          const isFilled = value <= activeValue;

          return (
            <button
              key={value}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onChange(value)}
              onMouseEnter={() => interactive && setHoverValue(value)}
              onMouseLeave={() => interactive && setHoverValue(0)}
              className={`${interactive ? 'cursor-pointer' : 'cursor-default'} transition-colors`}
            >
              <Star
                className={`${starSize} ${
                  isFilled
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-gray-600'
                } ${interactive && !isFilled ? 'hover:text-amber-300' : ''} transition-colors`}
              />
            </button>
          );
        })}
      </div>

      {/* Numeric value */}
      {showValue && rating > 0 && (
        <span className="text-sm font-semibold text-amber-400 ml-0.5">
          {Number(rating).toFixed(1)}
        </span>
      )}

      {/* Review count */}
      {count !== undefined && (
        <span className="text-sm text-gray-500 ml-0.5">
          ({count})
        </span>
      )}
    </div>
  );
}
