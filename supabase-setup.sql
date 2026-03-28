-- ============================================================
-- Course Compass — Supabase Database Setup
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. TABLES
-- ============================================================

-- Profiles (linked to auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'student', 'instructor')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Instructor Applications
CREATE TABLE instructor_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bio TEXT NOT NULL DEFAULT '',
  expertise TEXT NOT NULL DEFAULT '',
  course_topics TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

-- Courses
CREATE TABLE courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  image_url TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  duration TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Course Materials
CREATE TABLE course_materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'pdf',
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enrollments
CREATE TABLE enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, course_id)
);

-- Material Progress
CREATE TABLE material_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES course_materials(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  UNIQUE(student_id, material_id)
);

-- Payments
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  provider TEXT NOT NULL DEFAULT 'stripe',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TRIGGER — Auto-create profile on signup
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    'student'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. HELPER FUNCTION — Get current user's role
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 4. ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can manage all profiles"
  ON profiles FOR ALL USING (get_user_role() = 'admin');

-- INSTRUCTOR APPLICATIONS
CREATE POLICY "Users can view own applications"
  ON instructor_applications FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can submit applications"
  ON instructor_applications FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all applications"
  ON instructor_applications FOR SELECT USING (get_user_role() = 'admin');

CREATE POLICY "Admins can update applications"
  ON instructor_applications FOR UPDATE USING (get_user_role() = 'admin');

-- COURSES
CREATE POLICY "Anyone can view published courses"
  ON courses FOR SELECT USING (
    status = 'published'
    OR instructor_id = auth.uid()
    OR get_user_role() = 'admin'
  );

CREATE POLICY "Instructors can create courses"
  ON courses FOR INSERT WITH CHECK (
    instructor_id = auth.uid()
    AND get_user_role() = 'instructor'
  );

CREATE POLICY "Instructors can update own courses"
  ON courses FOR UPDATE USING (
    instructor_id = auth.uid()
    OR get_user_role() = 'admin'
  );

CREATE POLICY "Instructors can delete own courses"
  ON courses FOR DELETE USING (
    instructor_id = auth.uid()
    OR get_user_role() = 'admin'
  );

-- COURSE MATERIALS
CREATE POLICY "Enrolled students and course owner can view materials"
  ON course_materials FOR SELECT USING (
    EXISTS (SELECT 1 FROM courses WHERE courses.id = course_materials.course_id AND courses.instructor_id = auth.uid())
    OR EXISTS (SELECT 1 FROM enrollments WHERE enrollments.course_id = course_materials.course_id AND enrollments.student_id = auth.uid() AND enrollments.payment_status = 'completed')
    OR get_user_role() = 'admin'
  );

CREATE POLICY "Instructors can add materials to own courses"
  ON course_materials FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM courses WHERE courses.id = course_materials.course_id AND courses.instructor_id = auth.uid())
  );

CREATE POLICY "Instructors can update own course materials"
  ON course_materials FOR UPDATE USING (
    EXISTS (SELECT 1 FROM courses WHERE courses.id = course_materials.course_id AND courses.instructor_id = auth.uid())
    OR get_user_role() = 'admin'
  );

CREATE POLICY "Instructors can delete own course materials"
  ON course_materials FOR DELETE USING (
    EXISTS (SELECT 1 FROM courses WHERE courses.id = course_materials.course_id AND courses.instructor_id = auth.uid())
    OR get_user_role() = 'admin'
  );

-- ENROLLMENTS
CREATE POLICY "Students can view own enrollments"
  ON enrollments FOR SELECT USING (
    student_id = auth.uid()
    OR get_user_role() = 'admin'
  );

CREATE POLICY "Instructors can view enrollments for own courses"
  ON enrollments FOR SELECT USING (
    EXISTS (SELECT 1 FROM courses WHERE courses.id = enrollments.course_id AND courses.instructor_id = auth.uid())
  );

CREATE POLICY "Students can enroll"
  ON enrollments FOR INSERT WITH CHECK (student_id = auth.uid());

-- MATERIAL PROGRESS
CREATE POLICY "Students can manage own progress"
  ON material_progress FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Admins can view all progress"
  ON material_progress FOR SELECT USING (get_user_role() = 'admin');

-- PAYMENTS
CREATE POLICY "Students can view own payments"
  ON payments FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Admins can view all payments"
  ON payments FOR SELECT USING (get_user_role() = 'admin');

-- Payments are inserted server-side (Stripe webhook), so no INSERT policy for users.
-- The Edge Function uses the service_role key which bypasses RLS.

-- 5. STORAGE BUCKETS
-- ============================================================
-- Create these manually in Supabase Dashboard > Storage:
--   1. "course-images" (public bucket) — course thumbnails
--   2. "course-materials" (private bucket) — downloadable files

-- Storage policies for course-images
INSERT INTO storage.buckets (id, name, public) VALUES ('course-images', 'course-images', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Instructors can upload course images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'course-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view course images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'course-images');

CREATE POLICY "Instructors can delete own course images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'course-images' AND auth.uid() IS NOT NULL);

-- Storage policies for course-materials
INSERT INTO storage.buckets (id, name, public) VALUES ('course-materials', 'course-materials', false)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Instructors can upload course materials"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'course-materials' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view course materials"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'course-materials' AND auth.uid() IS NOT NULL);

CREATE POLICY "Instructors can delete own course materials"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'course-materials' AND auth.uid() IS NOT NULL);
