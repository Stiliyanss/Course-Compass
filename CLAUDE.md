# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Course Compass is a course marketplace with three roles: **admin** (manages everything), **instructor** (creates courses), and **student** (browses and buys courses). Everyone registers as a student; to become an instructor, users submit an application that an admin approves. Payments use Stripe Checkout. It is a client-only React application backed by Supabase (hosted PostgreSQL + auth + API).

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
- **Supabase** for database, auth, and API (`@supabase/supabase-js`)
- **React Router v7** for routing (`createBrowserRouter`)
- **TanStack Query (React Query)** for server state management
- **React Hook Form + Zod** for form handling and validation (Zod installed but validators currently use plain JS)
- **Lucide React** for icons
- **react-hot-toast** for notifications
- **clsx** for conditional class names
- **date-fns** for date formatting
- **Google Fonts** — Playfair Display (loaded in `index.html`) used for headings and branding

## Architecture

- **`client/src/main.jsx`** — entry point, wraps app in `QueryClientProvider` → `AuthProvider` → `RouterProvider` + `<Toaster />`
- **`client/src/lib/supabaseClient.js`** — single Supabase client instance
- **`client/src/context/AuthContext.jsx`** — provides `user`, `profile` (with role), `loading`, `signIn`, `signUp`, `signOut`, `resetPassword`
- **`client/src/routes/AppRouter.jsx`** — all routes defined here using nested layout pattern
- **`client/src/layouts/`** — page shells that render `<Outlet />`:
  - `PublicLayout` — Navbar + Footer (for `/`, `/courses`, etc.)
  - `AuthLayout` — dark glass card with logo (for `/login`, `/register`, `/forgot-password`)
  - `DashboardLayout` — Sidebar + top bar (for `/student/*`, `/instructor/*`, `/admin/*`)
- **`client/src/components/`** — shared UI:
  - `Navbar.jsx`, `Footer.jsx`, `Sidebar.jsx` — layout pieces
  - `ProtectedRoute.jsx` — role-based route guard (takes `allowedRoles` prop)
  - `BecomeInstructor.jsx` — CTA component shown to students on landing page
  - `ui/Button.jsx`, `ui/Input.jsx`, `ui/Spinner.jsx` — primitives
- **`client/src/pages/`** — route-level components organized by section (`auth/`, `public/`, `student/`, `instructor/`, `admin/`)
- **`client/src/api/`** — Supabase query functions (pure async, no React)
- **`client/src/hooks/`** — TanStack Query wrappers around api functions
- **`client/src/utils/`** — helpers: `constants.js` (role/status enums), `validators.js` (form validation), `getDashboardLink.js`

## Routing Structure

Routes are nested under layouts in `AppRouter.jsx`:

```
PublicLayout        → /  /courses  /courses/:id  /forbidden
AuthLayout          → /login  /register  /forgot-password
ProtectedRoute + DashboardLayout:
  student/instructor → /student/dashboard  /student/my-courses  /student/apply-instructor
  instructor         → /instructor/dashboard  /instructor/courses
  admin              → /admin/dashboard  /admin/users  /admin/courses  /admin/applications
```

## Database

Schema is defined in `supabase-setup.sql` at the project root. Seven tables:
- `profiles` — linked to `auth.users`, has `role` (student/instructor/admin)
- `instructor_applications` — students apply, admin approves/rejects
- `courses` — instructor_id, title, description, price, duration, status (draft/published/archived)
- `course_materials` — files attached to courses (PDF, ZIP, etc.)
- `enrollments` — student ↔ course with payment_status
- `material_progress` — per-material completion tracking
- `payments` — Stripe payment records

A trigger (`handle_new_user`) auto-creates a profile row on signup with `role = 'student'`. RLS policies enforce access control at the database level.

## Design System

Dark theme throughout. Key colors:
- **Backgrounds**: `slate-950`, `slate-900`
- **Borders**: `slate-800`
- **Primary accent**: purple (`purple-400`, `purple-600`)
- **Secondary accents**: amber, blue (used in gradients)
- **Text**: `white`, `gray-400`, `gray-300`
- **Effects**: backdrop blur, glow orbs (`blur-3xl` circles with low-opacity colors)

## Environment Variables

Defined in `client/.env` (prefixed with `VITE_` for Vite exposure):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
