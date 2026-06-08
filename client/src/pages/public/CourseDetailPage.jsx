import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCourse } from '../../hooks/useCourses';
import { useSections } from '../../hooks/useSections';
import { useEnrollmentCheck } from '../../hooks/useEnrollments';
import { useAuth } from '../../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Clock, User, BookOpen, ShoppingCart, ChevronDown, ChevronRight, FileText, Video, File, Download, Lock, Eye, NotebookPen, Save, X, Star, Pencil, Trash2, MessageSquare, Heart } from 'lucide-react';
import { format } from 'date-fns';
import { useNotes, useSaveNote } from '../../hooks/useNotes';
import { useProgress, useToggleProgress } from '../../hooks/useProgress';
import { supabase } from '../../lib/supabaseClient';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import MaterialPreview from '../../components/MaterialPreview';
import MaterialComments from '../../components/MaterialComments';
import SaleCountdown from '../../components/SaleCountdown';
import { isSaleActive, getSalePrice } from '../../utils/sale';
import StarRating from '../../components/StarRating';
import { useReviews, useMyReview, useCreateReview, useUpdateReview, useDeleteReview } from '../../hooks/useReviews';
import { useWishlistCheck, useToggleWishlist } from '../../hooks/useWishlist';
import toast from 'react-hot-toast';

export default function CourseDetailPage() {
  // useParams extracts the :id from the URL /courses/:id
  const { id } = useParams();

  // Fetch the course data including instructor profile
  const { data: course, isLoading, isError, error } = useCourse(id);

  // Fetch sections & materials for the course content preview
  const { data: sections = [] } = useSections(id);

  // Check if the current user is enrolled in this course
  // Returns true/false — controls whether download buttons appear
  const { data: isEnrolled = false } = useEnrollmentCheck(id);

  // Fetch the student's notes for this course (only if enrolled)
  const { data: notes = {} } = useNotes(isEnrolled ? id : null);
  const saveNoteMutation = useSaveNote(id);

  // Fetch progress — Set of completed material IDs
  const { data: completedSet = new Set() } = useProgress(isEnrolled ? id : null);
  const toggleProgress = useToggleProgress(id);

  // Fetch reviews for this course
  const { data: reviews = [] } = useReviews(id);
  const { data: myReview } = useMyReview(id);
  const createReviewMutation = useCreateReview(id);
  const updateReviewMutation = useUpdateReview(id);
  const deleteReviewMutation = useDeleteReview(id);

  // Calculate progress percentage across all sections
  const totalMaterials = sections.reduce((sum, s) => sum + (s.materials?.length || 0), 0);
  const completedCount = totalMaterials > 0
    ? sections.reduce((sum, s) => sum + (s.materials || []).filter((m) => completedSet.has(m.id)).length, 0)
    : 0;
  const progressPercent = totalMaterials > 0 ? Math.round((completedCount / totalMaterials) * 100) : 0;

  // State for the material preview modal
  // When a student clicks a material, we store the material object + its signed URL
  // Setting this to null closes the modal
  const [preview, setPreview] = useState(null); // { material, signedUrl }
  const [commentMaterial, setCommentMaterial] = useState(null); // material object for comments panel

  // Opens the preview modal for a material
  // 1. Gets a signed URL from Supabase (valid for 5 minutes)
  // 2. Stores both the material info and the URL in state
  // 3. This triggers the MaterialPreview modal to render
  async function handlePreview(material) {
    try {
      const { data, error } = await supabase.storage
        .from('course-materials')
        .createSignedUrl(material.file_url, 300); // 5 minutes — enough for Google Docs Viewer

      if (error) throw error;

      setPreview({ material, signedUrl: data.signedUrl });
    } catch (err) {
      toast.error('Failed to load preview: ' + err.message);
    }
  }

  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Wishlist
  const { data: isWishlisted = false } = useWishlistCheck(user ? id : null);
  const toggleWishlistMutation = useToggleWishlist(id);

  // Loading state for the buy button so we can show a spinner
  const [purchasing, setPurchasing] = useState(false);

  /**
   * Handles course purchase. Two paths:
   *
   * 1. FREE course (price = 0):
   *    - Inserts an enrollment row directly via Supabase
   *    - No Stripe needed — student is enrolled immediately
   *
   * 2. PAID course (price > 0):
   *    - Calls our create-checkout Edge Function
   *    - The function creates a Stripe Checkout Session
   *    - We redirect the browser to Stripe's payment page
   *    - After payment, Stripe's webhook creates the enrollment
   */
  async function handlePurchase() {
    // Must be logged in to buy
    if (!user) {
      navigate('/login');
      return;
    }

    setPurchasing(true);
    try {
      if (Number(course.price) === 0) {
        // ── Free course — enroll directly ──
        const { error: enrollError } = await supabase
          .from('enrollments')
          .insert({
            student_id: user.id,
            course_id: id,
            payment_status: 'completed',
          });

        if (enrollError) throw enrollError;

        // Refresh the enrollment check so the UI updates immediately
        queryClient.invalidateQueries({ queryKey: ['enrollment-check', id] });
        toast.success('Enrolled successfully!');
      } else {
        // ── Paid course — redirect to Stripe Checkout ──
        // Call our Edge Function which creates a Stripe Checkout Session
        const { data: sessionData, error: sessionError } = await supabase.functions
          .invoke('create-checkout', {
            body: { courseId: id },
          });

        if (sessionError) throw sessionError;
        if (!sessionData?.url) throw new Error('No checkout URL returned');

        // Redirect to Stripe's hosted payment page
        window.location.href = sessionData.url;
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPurchasing(false);
    }
  }

  if (isLoading) {
    return (
      <div className="py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20">
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-center">
          <p className="text-red-400">
            {error.message === 'JSON object requested, multiple (or no) rows returned'
              ? 'Course not found'
              : `Failed to load course: ${error.message}`}
          </p>
          <Link to="/courses" className="mt-4 inline-block text-sm text-purple-400 hover:underline">
            Back to courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-12">
      {/* Back link */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Link
          to="/courses"
          className="mb-8 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to courses
        </Link>
      </motion.div>

      <div className="grid gap-6 sm:gap-10 lg:grid-cols-3">
        {/* Left column — course info (takes 2/3 on large screens) */}
        <div className="space-y-6 sm:space-y-8 lg:col-span-2">
          {/* Preview Video or Thumbnail */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {course.preview_video_url ? (
              <div className="aspect-video w-full overflow-hidden rounded-xl border border-slate-800 bg-black">
                <video
                  src={course.preview_video_url}
                  controls
                  poster={course.image_url || undefined}
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <div className="aspect-video w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-800">
                {course.image_url ? (
                  <img
                    src={course.image_url}
                    alt={course.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-600">
                    No image
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-2xl font-bold text-white sm:text-3xl md:text-4xl"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {course.title}
          </motion.h1>

          {/* Meta row — instructor + duration */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-wrap items-center gap-6 text-gray-400"
          >
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{course.instructor?.full_name || 'Unknown instructor'}</span>
            </div>
            {course.duration && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{course.duration}</span>
              </div>
            )}
          </motion.div>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <h2 className="mb-3 text-xl font-semibold text-white">About this course</h2>
            <p className="leading-relaxed text-gray-300 whitespace-pre-line">
              {course.description || 'No description provided.'}
            </p>
          </motion.div>

          {/* Course Content — section list as a table of contents */}
          {sections.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <h2 className="mb-3 text-xl font-semibold text-white">Course Content</h2>
              <p className="mb-4 text-sm text-gray-400">
                {sections.length} {sections.length === 1 ? 'section' : 'sections'} &middot;{' '}
                {totalMaterials} materials
              </p>

              {/* Progress bar — only shown to enrolled students */}
              {isEnrolled && totalMaterials > 0 && (
                <div className="mb-5 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-300">Your Progress</span>
                    <span className="text-sm font-bold text-purple-400">{progressPercent}%</span>
                  </div>
                  {/* Track — the background bar */}
                  <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-800">
                    {/* Fill — the animated progress bar */}
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-purple-600 via-purple-500 to-violet-400 shadow-[0_0_12px_rgba(168,85,247,0.4)] transition-all duration-500 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                    {/* Shimmer effect — a subtle shine moving across the filled bar */}
                    {progressPercent > 0 && progressPercent < 100 && (
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_2s_infinite]"
                        style={{ width: `${progressPercent}%` }}
                      />
                    )}
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {completedCount} of {totalMaterials} materials completed
                  </p>
                </div>
              )}

              <div className="space-y-2">
                {sections.map((section, i) => (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 + Math.min(i * 0.08, 0.4) }}
                  >
                    <SectionPreview
                      section={section}
                      isEnrolled={isEnrolled}
                      onPreview={handlePreview}
                      onComment={setCommentMaterial}
                      noteContent={notes[section.id] || ''}
                      onSaveNote={saveNoteMutation}
                      completedSet={completedSet}
                      onToggleProgress={toggleProgress}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Instructor card */}
          {course.instructor && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <h2 className="mb-3 text-xl font-semibold text-white">Instructor</h2>
              <motion.div
                whileHover={{ borderColor: 'rgba(168,85,247,0.3)' }}
                transition={{ duration: 0.2 }}
                className="flex items-start gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-5"
              >
                {course.instructor.avatar_url ? (
                  <img
                    src={course.instructor.avatar_url}
                    alt={course.instructor.full_name}
                    className="h-14 w-14 rounded-full object-cover border border-slate-700"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-600/20 text-purple-400 font-bold text-lg">
                    {course.instructor.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-white">{course.instructor.full_name}</p>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ── Reviews section ── */}
          <ReviewsSection
            reviews={reviews}
            myReview={myReview}
            isEnrolled={isEnrolled}
            user={user}
            courseId={id}
            createMutation={createReviewMutation}
            updateMutation={updateReviewMutation}
            deleteMutation={deleteReviewMutation}
          />
        </div>

        {/* Right column — purchase card (sticky on scroll) */}
        <motion.div
          className="lg:col-span-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="sticky top-20 rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-5 sm:top-24 sm:p-6">
            {/* Price */}
            <div className="text-center space-y-2">
              {Number(course.price) === 0 ? (
                <span className="text-2xl font-bold text-white sm:text-3xl">Free</span>
              ) : isSaleActive(course) ? (
                <>
                  <div className="inline-block rounded-full bg-green-500/20 border border-green-500/30 px-3 py-1 text-sm font-bold text-green-400">
                    {Number(course.discount_percent)}% OFF
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-lg text-gray-500 line-through sm:text-xl">${Number(course.price).toFixed(2)}</span>
                    <span className="text-2xl font-bold text-green-400 sm:text-3xl">${getSalePrice(course).toFixed(2)}</span>
                  </div>
                  <SaleCountdown saleEndsAt={course.sale_ends_at} size="lg" />
                </>
              ) : (
                <span className="text-2xl font-bold text-white sm:text-3xl">${Number(course.price).toFixed(2)}</span>
              )}
            </div>

            {/* Buy button or enrolled badge */}
            {isEnrolled ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-center gap-2 rounded-lg bg-green-500/10 border border-green-500/30 py-3 text-green-400 font-medium"
              >
                <BookOpen className="h-5 w-5" />
                You are enrolled
              </motion.div>
            ) : (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button className="w-full" size="lg" onClick={handlePurchase} loading={purchasing}>
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  {Number(course.price) === 0 ? 'Enroll for Free' : isSaleActive(course) ? 'Buy Now' : 'Buy Course'}
                </Button>
              </motion.div>
            )}

            {/* Wishlist button */}
            {user && (
              <motion.button
                onClick={() => toggleWishlistMutation.mutate()}
                disabled={toggleWishlistMutation.isPending}
                whileTap={{ scale: 0.95 }}
                className={`relative flex w-full items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-colors overflow-hidden ${
                  isWishlisted
                    ? 'border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                    : 'border-slate-700 text-gray-400 hover:text-white hover:border-slate-600'
                }`}
              >
                {/* Ping ring on wishlist add */}
                <AnimatePresence>
                  {isWishlisted && (
                    <motion.span
                      key="ping"
                      initial={{ scale: 0.3, opacity: 0.7 }}
                      animate={{ scale: 3, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="absolute rounded-full border-2 border-red-500 h-6 w-6"
                    />
                  )}
                </AnimatePresence>
                <motion.span
                  key={isWishlisted ? 'filled' : 'empty'}
                  initial={{ scale: 0.5, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                >
                  <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-red-400' : ''}`} />
                </motion.span>
                {isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
              </motion.button>
            )}

            {/* Course details list */}
            <div className="space-y-3 border-t border-slate-800 pt-5">
              {course.duration && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Duration</span>
                  <span className="text-white">{course.duration}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Materials</span>
                <span className="flex items-center gap-1 text-white">
                  <BookOpen className="h-3.5 w-3.5" />
                  {isEnrolled ? 'Available below' : 'Available after purchase'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      {/* Preview modal — rendered when a student clicks a material */}
      <AnimatePresence>
        {preview && (
          <MaterialPreview
            material={preview.material}
            signedUrl={preview.signedUrl}
            onClose={() => setPreview(null)}
          />
        )}
      </AnimatePresence>
      {/* Comments panel — slides in from the right */}
      <AnimatePresence>
        {commentMaterial && (
          <MaterialComments
            material={commentMaterial}
            onClose={() => setCommentMaterial(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Download a file from the private course-materials bucket.
 *
 * Since the bucket is private, we can't just link to a public URL.
 * Instead, we use Supabase's createSignedUrl() which generates a
 * temporary URL (valid for 60 seconds) that grants access to the file.
 *
 * Steps:
 * 1. Ask Supabase for a signed URL for this file path
 * 2. Create a temporary <a> element with the signed URL
 * 3. Click it programmatically to trigger the browser download
 * 4. Clean up the temporary element
 */
async function handleDownload(filePath, title) {
  try {
    const { data, error } = await supabase.storage
      .from('course-materials')
      .createSignedUrl(filePath, 60); // URL valid for 60 seconds

    if (error) throw error;

    // Create a temporary link and click it to trigger download
    const link = document.createElement('a');
    link.href = data.signedUrl;
    link.download = title; // Suggests this filename to the browser
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    toast.error('Download failed: ' + err.message);
  }
}

/**
 * A helper that returns the right icon for a file type.
 * Videos get a Video icon, everything else gets FileText or generic File.
 */
/**
 * ReviewsSection — displays reviews, average rating, and review form.
 */
function ReviewsSection({ reviews, myReview, isEnrolled, user, courseId, createMutation, updateMutation, deleteMutation }) {
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  // Calculate average rating
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  // Rating distribution (how many 5-star, 4-star, etc.)
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    percent: reviews.length > 0
      ? Math.round((reviews.filter((r) => r.rating === star).length / reviews.length) * 100)
      : 0,
  }));

  function handleStartEdit() {
    setRating(myReview.rating);
    setComment(myReview.comment || '');
    setEditMode(true);
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditMode(false);
    setRating(0);
    setComment('');
  }

  function handleSubmit() {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (editMode) {
      updateMutation.mutate(
        { reviewId: myReview.id, rating, comment },
        {
          onSuccess: () => {
            toast.success('Review updated!');
            handleCancel();
          },
          onError: (err) => toast.error(err.message),
        }
      );
    } else {
      createMutation.mutate(
        { courseId, rating, comment },
        {
          onSuccess: () => {
            toast.success('Review submitted!');
            handleCancel();
          },
          onError: (err) => toast.error(err.message),
        }
      );
    }
  }

  function handleDelete() {
    deleteMutation.mutate(myReview.id, {
      onSuccess: () => toast.success('Review deleted'),
      onError: (err) => toast.error(err.message),
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.6 }}
    >
      <h2 className="mb-4 text-xl font-semibold text-white flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-purple-400" />
        Reviews
        {reviews.length > 0 && (
          <span className="text-sm font-normal text-gray-500">({reviews.length})</span>
        )}
      </h2>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
        {/* Summary header — average rating + distribution */}
        {reviews.length > 0 ? (
          <div className="flex flex-col sm:flex-row gap-6 p-6 border-b border-slate-800">
            {/* Left: big average */}
            <div className="flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-white">{avgRating}</span>
              <StarRating rating={Math.round(Number(avgRating))} size="md" />
              <span className="mt-1 text-xs text-gray-500">{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</span>
            </div>

            {/* Right: distribution bars */}
            <div className="flex-1 space-y-1.5">
              {distribution.map((d) => (
                <div key={d.star} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-3">{d.star}</span>
                  <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                  <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all duration-500"
                      style={{ width: `${d.percent}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-6 text-right">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-6 border-b border-slate-800 text-center">
            <MessageSquare className="mx-auto h-8 w-8 text-gray-600 mb-2" />
            <p className="text-sm text-gray-500">No reviews yet. Be the first to review!</p>
          </div>
        )}

        {/* Write / Edit review form */}
        {isEnrolled && user && (
          <div className="p-6 border-b border-slate-800">
            {showForm ? (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-white">
                  {editMode ? 'Edit your review' : 'Write a review'}
                </h3>

                {/* Star input */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Your rating</label>
                  <StarRating rating={rating} onChange={setRating} size="lg" />
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Comment (optional)</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    placeholder="Share your experience with this course..."
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none"
                  />
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSubmit}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 transition-colors disabled:opacity-50"
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? 'Saving...'
                      : editMode ? 'Update Review' : 'Submit Review'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : myReview ? (
              /* User already has a review — show edit/delete buttons */
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">You reviewed this course</span>
                <button
                  onClick={handleStartEdit}
                  className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </button>
              </div>
            ) : (
              /* No review yet — show write button */
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-2.5 text-sm font-medium text-purple-400 hover:bg-purple-500/20 transition-colors"
              >
                <Star className="h-4 w-4" />
                Write a Review
              </button>
            )}
          </div>
        )}

        {/* Review list */}
        {reviews.length > 0 && (
          <div className="divide-y divide-slate-800">
            {reviews.map((review, i) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.08, 0.4) }}
                className="p-5 hover:bg-slate-800/20 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="h-9 w-9 shrink-0 rounded-full overflow-hidden border border-slate-700 bg-slate-800">
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
                    {/* Name + date */}
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white">{review.student_name}</span>
                      <span className="text-xs text-gray-600">
                        {format(new Date(review.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>

                    {/* Stars */}
                    <StarRating rating={review.rating} size="sm" />

                    {/* Comment */}
                    {review.comment && (
                      <p className="mt-2 text-sm text-gray-400 leading-relaxed">{review.comment}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function getMaterialIcon(fileType) {
  const videoTypes = ['mp4', 'webm', 'mov', 'avi'];
  const docTypes = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt'];

  if (videoTypes.includes(fileType)) return Video;
  if (docTypes.includes(fileType)) return FileText;
  return File;
}

/**
 * SectionPreview — a collapsible section that shows material names.
 * Clicking the section header toggles the material list open/closed.
 *
 * This is a "preview" — no download links. Students can see what's
 * inside each section before purchasing the course.
 */
function SectionPreview({ section, isEnrolled, onPreview, onComment, noteContent, onSaveNote, completedSet, onToggleProgress }) {
  const [open, setOpen] = useState(false);
  const materialCount = section.materials?.length || 0;

  // Local state for the note text — initialized from saved content
  // We keep a local copy so typing is instant (no waiting for server)
  const [note, setNote] = useState(noteContent);
  // Track whether the note has unsaved changes
  const [hasChanges, setHasChanges] = useState(false);
  // Toggle notes area visibility
  const [showNotes, setShowNotes] = useState(false);

  // Update local state when saved content changes (e.g. on first load)
  // This runs when noteContent prop changes (data arrives from server)
  if (noteContent !== note && !hasChanges) {
    setNote(noteContent);
  }

  function handleNoteChange(e) {
    setNote(e.target.value);
    setHasChanges(true);
  }

  function handleSaveNote() {
    onSaveNote.mutate(
      { sectionId: section.id, content: note },
      {
        onSuccess: () => {
          setHasChanges(false);
          toast.success('Note saved');
        },
        onError: (err) => toast.error('Failed to save note: ' + err.message),
      }
    );
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 overflow-hidden">
      {/* Section header — click to expand/collapse */}
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-800/50 transition-colors"
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
          {materialCount} {materialCount === 1 ? 'material' : 'materials'}
        </span>
      </button>

      {/* Material list — only visible when expanded */}
      {open && materialCount > 0 && (
        <div className="border-t border-slate-800 px-4 py-2">
          {section.materials.map((material) => {
            const Icon = getMaterialIcon(material.file_type);
            const isCompleted = completedSet?.has(material.id);
            return (
              <div
                key={material.id}
                className="flex items-center justify-between py-2 text-sm text-gray-400"
              >
                <div className="flex items-center gap-3">
                  {/* Checkbox — only for enrolled students */}
                  {isEnrolled && (
                    <button
                      onClick={() => onToggleProgress.mutate({
                        materialId: material.id,
                        completed: !isCompleted,
                      })}
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all ${
                        isCompleted
                          ? 'border-purple-500 bg-purple-600 text-white shadow-[0_0_8px_rgba(168,85,247,0.3)]'
                          : 'border-slate-600 hover:border-purple-500/50'
                      }`}
                    >
                      {isCompleted && (
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  )}

                  {/* Material name — clickable for enrolled students to open preview */}
                  {isEnrolled ? (
                    <button
                      onClick={() => onPreview(material)}
                      className={`flex items-center gap-3 hover:text-white transition-colors ${isCompleted ? 'line-through text-gray-500' : ''}`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{material.title}</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{material.title}</span>
                    </div>
                  )}
                </div>

                {/* Right side — preview/download/comments buttons if enrolled, lock if not */}
                {isEnrolled ? (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onPreview(material)}
                      className="flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="text-xs">Preview</span>
                    </button>
                    <button
                      onClick={() => onComment(material)}
                      className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span className="text-xs">Comments</span>
                    </button>
                    <button
                      onClick={() => handleDownload(material.file_url, material.title)}
                      className="flex items-center gap-1 text-gray-400 hover:text-gray-300 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      <span className="text-xs">Download</span>
                    </button>
                  </div>
                ) : (
                  <Lock className="h-3.5 w-3.5 text-gray-600" />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Notebook button — only visible to enrolled students when section is expanded */}
      {open && isEnrolled && (
        <div className="border-t border-slate-800 px-4 py-3">
          {!showNotes ? (
            // Notebook toggle button — looks like a small notebook
            <button
              onClick={() => setShowNotes(true)}
              className="group relative flex items-center gap-3 rounded-lg border border-slate-700/50 bg-gradient-to-r from-slate-800/80 to-slate-800/40 px-4 py-2.5 transition-all hover:border-purple-500/40 hover:shadow-[0_0_15px_rgba(168,85,247,0.1)]"
            >
              {/* Notebook icon with glow effect on hover */}
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-500/10 text-purple-400 transition-colors group-hover:bg-purple-500/20">
                <NotebookPen className="h-4 w-4" />
              </div>
              <div className="text-left">
                <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                  My Notebook
                </span>
                <p className="text-xs text-gray-500">
                  {noteContent ? 'View your notes' : 'Add notes for this section'}
                </p>
              </div>
              {/* Indicator dot if notes exist */}
              {noteContent && (
                <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.6)]" />
              )}
            </button>
          ) : (
            // Expanded notebook — futuristic card with glowing border
            <div className="relative rounded-xl border border-purple-500/20 bg-gradient-to-b from-slate-800/90 to-slate-900/90 overflow-hidden shadow-[0_0_20px_rgba(168,85,247,0.05)]">
              {/* Decorative top glow line */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

              {/* Notebook header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-purple-500/15">
                    <NotebookPen className="h-3.5 w-3.5 text-purple-400" />
                  </div>
                  <span className="text-sm font-semibold text-purple-300">Notebook</span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Save button — glowing when there are changes */}
                  {hasChanges && (
                    <button
                      onClick={handleSaveNote}
                      disabled={onSaveNote.isPending}
                      className="flex items-center gap-1.5 rounded-lg bg-purple-600/80 px-3 py-1.5 text-xs font-medium text-white shadow-[0_0_10px_rgba(168,85,247,0.3)] transition-all hover:bg-purple-500 hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] disabled:opacity-50"
                    >
                      <Save className="h-3 w-3" />
                      {onSaveNote.isPending ? 'Saving...' : 'Save'}
                    </button>
                  )}
                  {/* Close button */}
                  <button
                    onClick={() => setShowNotes(false)}
                    className="rounded-md p-1 text-gray-500 hover:bg-slate-700/50 hover:text-gray-300 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Notebook writing area — styled like a notebook page */}
              <div className="relative px-4 py-3">
                {/* Faint vertical line on the left like a ruled notebook */}
                <div className="absolute left-10 top-0 bottom-0 w-px bg-purple-500/10" />

                <textarea
                  value={note}
                  onChange={handleNoteChange}
                  placeholder="Start writing your notes..."
                  className="w-full resize-y rounded-lg border-0 bg-transparent pl-8 pr-2 py-1 text-sm leading-7 text-gray-200 placeholder-gray-600 focus:outline-none min-h-[140px]"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, rgba(148, 163, 184, 0.06) 27px, rgba(148, 163, 184, 0.06) 28px)',
                  }}
                />
              </div>

              {/* Notebook footer — subtle status info */}
              <div className="flex items-center justify-between border-t border-slate-700/30 px-4 py-2">
                <span className="text-[11px] text-gray-600">
                  {note.length > 0
                    ? `${note.trim().split(/\s+/).filter(Boolean).length} words · ${note.length} chars`
                    : 'Empty'}
                </span>
                {hasChanges && (
                  <span className="flex items-center gap-1 text-[11px] text-amber-500/70">
                    <span className="h-1 w-1 rounded-full bg-amber-500/70" />
                    Unsaved changes
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
