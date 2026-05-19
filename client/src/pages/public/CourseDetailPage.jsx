import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCourse } from '../../hooks/useCourses';
import { useSections } from '../../hooks/useSections';
import { useEnrollmentCheck } from '../../hooks/useEnrollments';
import { ArrowLeft, Clock, User, BookOpen, ShoppingCart, ChevronDown, ChevronRight, FileText, Video, File, Download, Lock, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import MaterialPreview from '../../components/MaterialPreview';
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

  // State for the material preview modal
  // When a student clicks a material, we store the material object + its signed URL
  // Setting this to null closes the modal
  const [preview, setPreview] = useState(null); // { material, signedUrl }

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
    <div className="mx-auto max-w-5xl px-6 py-12">
      {/* Back link */}
      <Link
        to="/courses"
        className="mb-8 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to courses
      </Link>

      <div className="grid gap-10 lg:grid-cols-3">
        {/* Left column — course info (takes 2/3 on large screens) */}
        <div className="space-y-8 lg:col-span-2">
          {/* Thumbnail */}
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

          {/* Title */}
          <h1
            className="text-3xl font-bold text-white md:text-4xl"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {course.title}
          </h1>

          {/* Meta row — instructor + duration */}
          <div className="flex flex-wrap items-center gap-6 text-gray-400">
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
          </div>

          {/* Description */}
          <div>
            <h2 className="mb-3 text-xl font-semibold text-white">About this course</h2>
            <p className="leading-relaxed text-gray-300 whitespace-pre-line">
              {course.description || 'No description provided.'}
            </p>
          </div>

          {/* Course Content — section list as a table of contents */}
          {sections.length > 0 && (
            <div>
              <h2 className="mb-3 text-xl font-semibold text-white">Course Content</h2>
              <p className="mb-4 text-sm text-gray-400">
                {sections.length} {sections.length === 1 ? 'section' : 'sections'} &middot;{' '}
                {sections.reduce((sum, s) => sum + (s.materials?.length || 0), 0)} materials
              </p>
              <div className="space-y-2">
                {sections.map((section) => (
                  <SectionPreview
                    key={section.id}
                    section={section}
                    isEnrolled={isEnrolled}
                    onPreview={handlePreview}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Instructor card */}
          {course.instructor && (
            <div>
              <h2 className="mb-3 text-xl font-semibold text-white">Instructor</h2>
              <div className="flex items-start gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-5">
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
              </div>
            </div>
          )}
        </div>

        {/* Right column — purchase card (sticky on scroll) */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-xl border border-slate-800 bg-slate-900/70 p-6 space-y-5">
            {/* Price */}
            <div className="text-center">
              <span className="text-3xl font-bold text-white">
                {Number(course.price) === 0 ? 'Free' : `$${Number(course.price).toFixed(2)}`}
              </span>
            </div>

            {/* Buy button or enrolled badge */}
            {isEnrolled ? (
              <div className="flex items-center justify-center gap-2 rounded-lg bg-green-500/10 border border-green-500/30 py-3 text-green-400 font-medium">
                <BookOpen className="h-5 w-5" />
                You are enrolled
              </div>
            ) : (
              <Button className="w-full" size="lg">
                <ShoppingCart className="mr-2 h-5 w-5" />
                {Number(course.price) === 0 ? 'Enroll for Free' : 'Buy Course'}
              </Button>
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
        </div>
      </div>
      {/* Preview modal — rendered when a student clicks a material */}
      {preview && (
        <MaterialPreview
          material={preview.material}
          signedUrl={preview.signedUrl}
          onClose={() => setPreview(null)}
        />
      )}
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
function SectionPreview({ section, isEnrolled, onPreview }) {
  const [open, setOpen] = useState(false);
  const materialCount = section.materials?.length || 0;

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
            return (
              <div
                key={material.id}
                className="flex items-center justify-between py-2 text-sm text-gray-400"
              >
                {/* Material name — clickable for enrolled students to open preview */}
                {isEnrolled ? (
                  <button
                    onClick={() => onPreview(material)}
                    className="flex items-center gap-3 hover:text-white transition-colors"
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

                {/* Right side — preview/download buttons if enrolled, lock if not */}
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
    </div>
  );
}
