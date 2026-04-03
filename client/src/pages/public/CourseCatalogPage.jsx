import { useState, useCallback } from 'react';
import { useCourses } from '../../hooks/useCourses';
import CourseCard from '../../components/CourseCard';
import SearchBar from '../../components/SearchBar';
import Spinner from '../../components/ui/Spinner';

export default function CourseCatalogPage() {
  // This state holds the current search term.
  // It updates when the SearchBar's debounce fires.
  const [search, setSearch] = useState('');

  // useCallback prevents the SearchBar from re-rendering on every parent render.
  // Without it, the onSearch prop would be a new function reference each time,
  // which would reset the debounce timer inside SearchBar.
  const handleSearch = useCallback((value) => {
    setSearch(value);
  }, []);

  // Fetch courses from Supabase, filtered by search term.
  // When search changes, TanStack Query automatically refetches
  // because the queryKey includes the filters.
  const { data: courses, isLoading, isError, error } = useCourses(
    search ? { search } : {}
  );

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      {/* Page header + search */}
      <div className="mb-10 space-y-6">
        <div>
          <h1
            className="text-3xl font-bold text-white md:text-4xl"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Browse Courses
          </h1>
          <p className="mt-2 text-gray-400">
            Explore courses from our community of instructors
          </p>
        </div>

        <div className="max-w-md">
          <SearchBar onSearch={handleSearch} />
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="py-20">
          <Spinner size="lg" />
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-center">
          <p className="text-red-400">
            Failed to load courses: {error.message}
          </p>
        </div>
      )}

      {/* Course grid */}
      {!isLoading && !isError && courses && (
        <>
          {courses.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-lg text-gray-400">
                {search ? `No courses found for "${search}"` : 'No courses available yet'}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
