import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCourse, useCreateCourse, useUpdateCourse } from '../../hooks/useCourses';
import { uploadCourseImage, uploadPreviewVideo } from '../../api/courses';
import { validateCourse, hasErrors } from '../../utils/validators';
import { ArrowLeft, Save, Upload, X, Video } from 'lucide-react';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

/**
 * Shared form for creating and editing courses.
 *
 * How it knows which mode it's in:
 * - URL is /instructor/courses/new       → no :id param → CREATE mode
 * - URL is /instructor/courses/:id/edit  → has :id param → EDIT mode
 *
 * In edit mode, it fetches the existing course data and pre-fills the form.
 */
export default function CourseFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: existingCourse, isLoading: courseLoading } = useCourse(id);
  const createMutation = useCreateCourse();
  const updateMutation = useUpdateCourse();

  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    duration: '',
    category: '',
    preview_video_url: '',
  });
  const [errors, setErrors] = useState({});

  // Image state — separate from form because it's handled differently
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  // Video state
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const videoInputRef = useRef(null);

  // When editing, pre-fill the form once the course data loads
  useEffect(() => {
    if (existingCourse) {
      setForm({
        title: existingCourse.title || '',
        description: existingCourse.description || '',
        price: existingCourse.price?.toString() || '',
        duration: existingCourse.duration || '',
        category: existingCourse.category || '',
        preview_video_url: existingCourse.preview_video_url || '',
      });
      // Show existing image as preview
      if (existingCourse.image_url) {
        setImagePreview(existingCourse.image_url);
      }
      if (existingCourse.preview_video_url) {
        setVideoPreview(existingCourse.preview_video_url);
      }
    }
  }, [existingCourse]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: undefined });
    }
  }

  function handleImageSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    setImageFile(file);
    // Create a local preview URL so the user sees the image immediately
    setImagePreview(URL.createObjectURL(file));
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function handleVideoSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast.error('Video must be under 100MB');
      return;
    }

    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  }

  function removeVideo() {
    setVideoFile(null);
    setVideoPreview(null);
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const validationErrors = validateCourse(form);
    if (hasErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    setIsSaving(true);

    try {
      const courseData = {
        ...form,
        price: parseFloat(form.price),
      };

      // Remove preview_video_url from courseData — it's handled by the file upload
      delete courseData.preview_video_url;

      if (isEditing) {
        if (imageFile) {
          const imageUrl = await uploadCourseImage(imageFile, id);
          courseData.image_url = imageUrl;
        }
        if (videoFile) {
          const videoUrl = await uploadPreviewVideo(videoFile, id);
          courseData.preview_video_url = videoUrl;
        } else if (!videoPreview) {
          // Video was removed
          courseData.preview_video_url = '';
        }

        updateMutation.mutate(
          { id, ...courseData },
          {
            onSuccess: () => {
              toast.success('Course updated');
              navigate('/instructor/courses');
            },
            onError: (err) => toast.error(err.message),
            onSettled: () => setIsSaving(false),
          }
        );
      } else {
        // CREATE MODE:
        // 1. Create the course first (to get the auto-generated ID)
        // 2. If an image was selected, upload it using the new ID
        // 3. Update the course with the image URL
        createMutation.mutate(courseData, {
          onSuccess: async (newCourse) => {
            const updates = {};

            try {
              if (imageFile) {
                updates.image_url = await uploadCourseImage(imageFile, newCourse.id);
              }
              if (videoFile) {
                updates.preview_video_url = await uploadPreviewVideo(videoFile, newCourse.id);
              }
            } catch {
              // Continue even if uploads fail
            }

            if (Object.keys(updates).length > 0) {
              updateMutation.mutate(
                { id: newCourse.id, ...updates },
                {
                  onSuccess: () => {
                    toast.success('Course created');
                    navigate('/instructor/courses');
                  },
                  onError: () => {
                    toast.success('Course created (some uploads failed)');
                    navigate('/instructor/courses');
                  },
                  onSettled: () => setIsSaving(false),
                }
              );
            } else {
              toast.success('Course created');
              navigate('/instructor/courses');
              setIsSaving(false);
            }
          },
          onError: (err) => {
            toast.error(err.message);
            setIsSaving(false);
          },
        });
      }
    } catch (err) {
      toast.error(err.message);
      setIsSaving(false);
    }
  }

  if (isEditing && courseLoading) {
    return (
      <div className="py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-6 px-3 sm:py-10 sm:px-6">
      {/* Back link */}
      <button
        onClick={() => navigate('/instructor/courses')}
        className="mb-8 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to courses
      </button>

      <h1
        className="text-3xl font-bold text-white"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        {isEditing ? 'Edit Course' : 'Create New Course'}
      </h1>
      <p className="mt-2 text-gray-400">
        {isEditing
          ? 'Update your course details below.'
          : 'Fill in the details below. Your course will start as a draft — you can publish it when ready.'}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {/* Title */}
        <Field
          label="Course Title"
          name="title"
          type="text"
          value={form.title}
          onChange={handleChange}
          error={errors.title}
          placeholder="e.g. Introduction to React"
        />

        {/* Description */}
        <div>
          <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-gray-300">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={5}
            placeholder="What will students learn in this course?"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none"
          />
          {errors.description && <p className="mt-1 text-sm text-red-400">{errors.description}</p>}
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="mb-1.5 block text-sm font-medium text-gray-300">
            Category
          </label>
          <select
            id="category"
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-purple-500 focus:ring-1 focus:ring-purple-500 cursor-pointer"
          >
            <option value="" disabled>Select a category</option>
            <option value="Development">Development</option>
            <option value="Business">Business</option>
            <option value="Finance & Accounting">Finance &amp; Accounting</option>
            <option value="IT & Software">IT &amp; Software</option>
            <option value="Office Productivity">Office Productivity</option>
            <option value="Personal Development">Personal Development</option>
            <option value="Design">Design</option>
            <option value="Marketing">Marketing</option>
            <option value="Health & Fitness">Health &amp; Fitness</option>
            <option value="Music">Music</option>
          </select>
          {errors.category && <p className="mt-1 text-sm text-red-400">{errors.category}</p>}
        </div>

        {/* Price + Duration */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Price ($)"
            name="price"
            type="number"
            value={form.price}
            onChange={handleChange}
            error={errors.price}
            placeholder="0.00"
            min="0"
            step="0.01"
          />
          <Field
            label="Duration"
            name="duration"
            type="text"
            value={form.duration}
            onChange={handleChange}
            error={errors.duration}
            placeholder="e.g. 8 hours, 12 weeks"
          />
        </div>

        {/* Course Image */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">
            Course Image (optional)
          </label>

          {imagePreview ? (
            // Show preview with remove button
            <div className="relative overflow-hidden rounded-lg border border-slate-800">
              <img
                src={imagePreview}
                alt="Course preview"
                className="h-48 w-full object-cover"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            // Show upload area
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed border-slate-700 bg-slate-800/50 px-6 py-8 text-gray-400 hover:border-purple-500/50 hover:text-gray-300 transition-colors"
            >
              <Upload className="h-8 w-8" />
              <span className="text-sm">Click to upload an image</span>
              <span className="text-xs text-gray-500">PNG, JPG, WebP — max 5MB</span>
            </button>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>

        {/* Preview Video */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">
            Preview Video (optional)
          </label>

          {videoPreview ? (
            <div className="relative overflow-hidden rounded-lg border border-slate-800">
              <video
                src={videoPreview}
                controls
                className="w-full max-h-64 object-contain bg-black"
              />
              <button
                type="button"
                onClick={removeVideo}
                className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed border-slate-700 bg-slate-800/50 px-6 py-8 text-gray-400 hover:border-purple-500/50 hover:text-gray-300 transition-colors"
            >
              <Video className="h-8 w-8" />
              <span className="text-sm">Click to upload a preview video</span>
              <span className="text-xs text-gray-500">MP4, WebM, MOV — max 100MB</span>
            </button>
          )}

          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            onChange={handleVideoSelect}
            className="hidden"
          />
        </div>

        {/* Submit */}
        <Button type="submit" loading={isSaving} className="w-full py-3">
          <Save className="mr-2 h-4 w-4" />
          {isEditing ? 'Save Changes' : 'Create Course'}
        </Button>
      </form>
    </div>
  );
}

function Field({ label, name, type = 'text', value, onChange, error, placeholder, ...props }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-gray-300">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
}
