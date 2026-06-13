# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Course Compass is a course marketplace with three roles: **admin** (manages everything), **instructor** (creates courses), and **student** (browses and buys courses). Everyone registers as a student; to become an instructor, users submit an application that an admin approves. Payments use Stripe Checkout. It is a client-only React application backed by Supabase (hosted PostgreSQL + auth + API). An AI chat assistant (Groq-powered, via Supabase Edge Function) helps students with course-related questions using function calling to query real data.

## Commands

All commands run from the `client/` directory:

```bash
npm run dev      # Start Vite dev server (http://localhost:5173)
npm run build    # Production build
npm run lint     # ESLint
npm run preview  # Preview production build
```

## Tech Stack

- **React 19** with JSX (not TypeScript)
- **Vite 8** for builds
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin (no tailwind.config.js — uses CSS-based config with `@import "tailwindcss"`)
- **Supabase** for database, auth, storage, and Edge Functions (`@supabase/supabase-js`)
- **React Router v7** for routing (`createBrowserRouter`)
- **TanStack Query (React Query)** for server state management
- **React Hook Form + Zod** for form handling and validation (validators use plain JS, not Zod)
- **Framer Motion** for animations (`motion.div`, `AnimatePresence`, `useInView`)
- **Lucide React** for icons
- **react-hot-toast** for notifications
- **clsx** for conditional class names
- **date-fns** for date formatting
- **Google Fonts** — Playfair Display (loaded in `index.html`) used for headings and branding

## Architecture

- **`client/src/main.jsx`** — entry point, wraps app in `QueryClientProvider` → `AuthProvider` → `RouterProvider` + `<Toaster />`
- **`client/src/lib/supabaseClient.js`** — single Supabase client instance
- **`client/src/context/AuthContext.jsx`** — provides `user`, `profile` (with role), `loading`, `signIn`, `signUp`, `signOut`, `refreshProfile`, `resetPassword`
- **`client/src/routes/AppRouter.jsx`** — all routes defined here using nested layout pattern
- **`client/src/layouts/`** — page shells that render `<Outlet />`:
  - `PublicLayout` — Navbar + Footer (for `/`, `/courses`, etc.)
  - `AuthLayout` — dark glass card with logo (for `/login`, `/register`, `/forgot-password`)
  - `DashboardLayout` — Sidebar + top bar (for `/student/*`, `/instructor/*`, `/admin/*`)
- **`client/src/components/`** — shared UI:
  - `Navbar.jsx`, `Footer.jsx`, `Sidebar.jsx` — layout pieces
  - `ProtectedRoute.jsx` — role-based route guard (takes `allowedRoles` prop)
  - `BecomeInstructor.jsx` — CTA component shown to students on landing page
  - `AvatarUpload.jsx` — clickable avatar with file picker, preview, and Supabase Storage upload
  - `CourseCard.jsx` — course preview card with heart wishlist toggle, category badge, sale badge, star rating
  - `SearchBar.jsx` — debounced search input (400ms delay)
  - `StarRating.jsx` — star display/input component (read-only or interactive)
  - `SaleCountdown.jsx` — countdown timer for course sales
  - `SetSaleModal.jsx` — modal for instructors to set discount/sale on a course
  - `MaterialPreview.jsx` — modal for previewing course materials (PDF, video, etc.)
  - `MaterialComments.jsx` — slide-in panel for per-material comments
  - `AiChat.jsx` — floating AI chat assistant widget
  - `ui/Button.jsx`, `ui/Input.jsx`, `ui/Spinner.jsx` — primitives
- **`client/src/pages/`** — route-level components organized by section (`auth/`, `public/`, `student/`, `instructor/`, `admin/`)
- **`client/src/api/`** — Supabase query functions (pure async, no React)
- **`client/src/hooks/`** — TanStack Query wrappers around api functions
- **`client/src/utils/`** — helpers: `constants.js` (role/status enums), `validators.js` (form validation), `getDashboardLink.js`, `sale.js` (sale price/active helpers)

## Routing Structure

Routes are nested under layouts in `AppRouter.jsx`:

```
PublicLayout        → /  /courses  /courses/:id  /payment/success  /forbidden
AuthLayout          → /login  /register  /forgot-password
ProtectedRoute + DashboardLayout:
  student/instructor → /student/dashboard  /student/my-courses  /student/wishlist  /student/apply-instructor
  instructor         → /instructor/dashboard  /instructor/courses  /instructor/courses/new
                       /instructor/courses/:id  /instructor/courses/:id/edit  /instructor/courses/:id/content
  admin              → /admin/dashboard  /admin/users  /admin/courses  /admin/applications
```

## Supabase Edge Functions

Located in `supabase/functions/`:

- **`ai-chat`** — AI assistant powered by Groq (Llama model). Uses OpenAI-compatible function calling with 7 tools that query Supabase tables (courses, enrollments, reviews, profiles, materials, progress, sections). Includes retry logic for 429 rate limits.
- **`create-checkout`** — Creates a Stripe Checkout Session for paid courses.
- **`stripe-webhook`** — Handles Stripe webhook events (payment success → creates enrollment).

## Database

The initial schema is in `supabase-setup.sql` at the project root, but it only covers the original 7 tables. Many tables and columns were added later directly via Supabase SQL Editor and are **not** in the SQL file. The live database is the source of truth.

**All tables (live database):**
- `profiles` — linked to `auth.users`; columns: id, full_name, email, role (student/instructor/admin), avatar_url, created_at
- `instructor_applications` — user_id, bio, expertise, course_topics, status (pending/approved/rejected), reviewed_at
- `courses` — instructor_id, title, description, image_url, price, duration, status (draft/published/archived), category, preview_video_url, discount_percent, sale_ends_at, created_at
- `course_sections` — course_id, title, order_index (added after initial setup)
- `course_materials` — course_id, section_id, title, file_url, file_type, order_index (section_id added later)
- `enrollments` — student_id, course_id, payment_status (pending/completed/failed), enrolled_at; UNIQUE(student_id, course_id)
- `material_progress` — student_id, course_id, material_id, completed, completed_at; UNIQUE(student_id, material_id)
- `payments` — student_id, course_id, amount, provider, status, stripe_session_id, created_at
- `course_reviews` — student_id, course_id, rating (1-5), comment, created_at (added after initial setup)
- `wishlists` — user_id, course_id, created_at (added after initial setup)
- `section_notes` — student_id, section_id, content, updated_at (added after initial setup)
- `material_comments` — student_id, material_id, content, created_at (added after initial setup)
- `learning_goals` — user_id, weekly_target, created_at (added after initial setup)
- `chat_rate_limits` — user_id, requested_at (used by ai-chat Edge Function for rate limiting)

A trigger (`handle_new_user`) auto-creates a profile row on signup with `role = 'student'`. A helper function `get_user_role()` returns the current user's role for RLS policies. RLS is enabled on all tables.

Learning streaks are calculated client-side from `material_progress.completed_at` timestamps — there is no separate streaks table.

**Storage buckets**: `course-images` (public), `course-materials` (private), `course-previews` (public — preview videos), `avatars` (public — profile photos).

## Design System

Dark theme throughout. Key colors:
- **Backgrounds**: `slate-950`, `slate-900`
- **Borders**: `slate-800`
- **Primary accent**: purple (`purple-400`, `purple-600`)
- **Secondary accents**: amber, blue, green (used in gradients, status badges)
- **Text**: `white`, `gray-400`, `gray-300`
- **Effects**: backdrop blur, glow orbs (`blur-3xl` circles with low-opacity colors)

### Animation Patterns (Framer Motion)
- `motion.div` with `initial={{ opacity: 0, y: 20 }}` + `animate={{ opacity: 1, y: 0 }}` for load animations
- `whileHover={{ y: -4 }}` or `whileHover={{ scale: 1.03 }}` for interactive elements
- `AnimatePresence` for mount/unmount transitions (modals, dropdowns)
- Staggered delays: `delay: Math.min(i * 0.08, 0.5)` for lists
- Use direct `animate` prop (not `useInView`) for above-fold content to avoid disappear-on-refresh bugs
- Keep animations subtle — no excessive effects

### Hero Banner Pattern
Dashboard pages use a consistent hero banner: rounded-2xl card with gradient background, glow orbs, badge pill, Playfair Display heading, and stats cards. See `StudentDashboardPage`, `WishlistPage`, `MyCoursesPage` for examples.

## Environment Variables

**Client** — defined in `client/.env` (prefixed with `VITE_` for Vite exposure):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**Edge Functions** — set in Supabase Dashboard > Edge Functions > Secrets:
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` — auto-injected by Supabase
- `SUPABASE_SERVICE_ROLE_KEY` — used by stripe-webhook (bypasses RLS)
- `STRIPE_SECRET_KEY` — Stripe API key (used by create-checkout and stripe-webhook)
- `STRIPE_WEBHOOK_SIGNING_SECRET` — verifies Stripe webhook signatures
- `GROQ_API_KEY` — Groq API key for AI chat (Llama 3.3 70B model)
