import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useCourses } from '../../hooks/useCourses';
import CourseCard from '../../components/CourseCard';
import SearchBar from '../../components/SearchBar';
import Spinner from '../../components/ui/Spinner';
import { ArrowUpDown, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'most-reviews', label: 'Most Reviews' },
  { value: 'a-z', label: 'A – Z' },
  { value: 'z-a', label: 'Z – A' },
];

export default function CourseCatalogPage() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setSortOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = useCallback((value) => {
    setSearch(value);
  }, []);

  const { data: courses, isLoading, isError, error } = useCourses(
    search ? { search } : {}
  );

  // Sort courses on the client side
  const sortedCourses = useMemo(() => {
    if (!courses) return [];
    const sorted = [...courses];

    switch (sortBy) {
      case 'price-low':
        return sorted.sort((a, b) => Number(a.price) - Number(b.price));
      case 'price-high':
        return sorted.sort((a, b) => Number(b.price) - Number(a.price));
      case 'most-reviews':
        return sorted.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
      case 'a-z':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case 'z-a':
        return sorted.sort((a, b) => b.title.localeCompare(a.title));
      case 'newest':
      default:
        return sorted;
    }
  }, [courses, sortBy]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      {/* Page header + search */}
      <div className="mb-10 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1
            className="text-3xl font-bold text-white md:text-4xl"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Browse Courses
          </h1>
          <p className="mt-2 text-gray-400">
            Explore courses from our community of instructors
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <div className="max-w-md flex-1">
            <SearchBar onSearch={handleSearch} />
          </div>

          {/* Sort dropdown */}
          <div className="relative" ref={sortRef}>
            <button
              onClick={() => setSortOpen((prev) => !prev)}
              className={`flex h-10 items-center gap-2 rounded-lg border bg-slate-800 px-3.5 text-sm transition-colors cursor-pointer ${
                sortOpen
                  ? 'border-purple-500 ring-1 ring-purple-500 text-white'
                  : 'border-slate-700 text-gray-300 hover:border-slate-600 hover:text-white'
              }`}
            >
              <ArrowUpDown className="h-4 w-4 text-purple-400" />
              <span>{SORT_OPTIONS.find((o) => o.value === sortBy)?.label}</span>
              <ChevronDown className={`h-3.5 w-3.5 text-gray-500 transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {sortOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-slate-700 bg-slate-800 shadow-xl shadow-black/40"
                >
                  {SORT_OPTIONS.map((opt, i) => (
                    <motion.button
                      key={opt.value}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.15, delay: i * 0.03 }}
                      onClick={() => {
                        setSortBy(opt.value);
                        setSortOpen(false);
                      }}
                      className={`flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                        sortBy === opt.value
                          ? 'bg-purple-600/15 text-purple-300'
                          : 'text-gray-300 hover:bg-slate-700/50 hover:text-white'
                      }`}
                    >
                      {opt.label}
                      {sortBy === opt.value && <Check className="h-4 w-4 text-purple-400" />}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Loading state */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-20"
          >
            <Spinner size="lg" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error state */}
      {isError && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-center"
        >
          <p className="text-red-400">
            Failed to load courses: {error.message}
          </p>
        </motion.div>
      )}

      {/* Course grid */}
      {!isLoading && !isError && courses && (
        <>
          {sortedCourses.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="py-20 text-center"
            >
              <p className="text-lg text-gray-400">
                {search ? `No courses found for "${search}"` : 'No courses available yet'}
              </p>
            </motion.div>
          ) : (
            <>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="mb-4 text-sm text-gray-500"
              >
                {sortedCourses.length} {sortedCourses.length === 1 ? 'course' : 'courses'} found
              </motion.p>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {sortedCourses.map((course, i) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: Math.min(i * 0.08, 0.5), ease: 'easeOut' }}
                    whileHover={{ y: -4 }}
                  >
                    <CourseCard course={course} />
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
