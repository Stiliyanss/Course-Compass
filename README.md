<div align="center">

# 🧭 Course Compass

## ✨ Overview

**Course Compass** is a full-featured course marketplace built on a modern serverless stack. It brings together three audiences under one roof:

- 🎓 **Students** — browse, search, and purchase courses, track progress through materials, and grow their skills
- 🧑‍🏫 **Instructors** — create courses, upload materials, and reach a global audience
- 🛡️ **Admins** — moderate the platform, approve instructor applications, and manage users

Everyone signs up as a student. Want to teach? Submit an instructor application and an admin will review it. Payments are handled securely through **Stripe Checkout**, and the entire backend runs on **Supabase** — no custom server required.

<br />

## 🎯 Features

<table>
<tr>
<td width="50%" valign="top">

### 🎓 For Students
- 🔍 Debounced search across the course catalog
- 🛒 Secure checkout powered by Stripe
- 📚 Personal dashboard with enrolled courses
- ✅ Per-material progress tracking
- 📝 Apply to become an instructor
- 👤 Avatar uploads with live preview

</td>
<td width="50%" valign="top">

### 🧑‍🏫 For Instructors
- ✍️ Create, edit, and publish courses
- 📎 Upload course materials (PDF, ZIP, etc.)
- 📦 Draft / Published / Archived states
- 💵 Set pricing and course duration
- 📊 Instructor dashboard overview

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🛡️ For Admins
- 👥 Manage all users and roles
- ✅ Approve, reject, or revoke instructor applications
- 🔐 Row-level security enforced at the DB
- 📈 Full platform oversight

</td>
<td width="50%" valign="top">

### 🎨 Polished UX
- 🌑 Beautiful dark theme with glass effects
- 🌌 Animated glow orbs and gradients
- 🔤 Playfair Display headings for branding
- 📱 Responsive across devices
- 🔥 Toast notifications via react-hot-toast

</td>
</tr>
</table>

<br />

## 🛠️ Tech Stack

<div align="center">

| Layer | Technology |
|:-----:|:-----------|
| ⚛️ **Frontend** | React 19 (JSX) · Vite 8 · React Router v7 |
| 🎨 **Styling** | Tailwind CSS v4 · Lucide React icons · Playfair Display |
| 🧠 **State** | TanStack Query (server state) · React Context (auth) |
| 📝 **Forms** | React Hook Form + plain-JS validators |
| 🗄️ **Backend** | Supabase (PostgreSQL · Auth · Storage · RLS) |
| 💳 **Payments** | Stripe Checkout |
| 🚀 **Deploy** | Vercel |

</div>

<br />

## 🏗️ Architecture

```
Course-Compass/
├── client/                      # 🎨 React + Vite frontend
│   └── src/
│       ├── api/                 # Pure Supabase query functions
│       ├── components/          # Reusable UI (Navbar, Sidebar, CourseCard…)
│       │   └── ui/              # Primitives (Button, Input, Spinner)
│       ├── context/             # AuthContext provider
│       ├── hooks/               # TanStack Query wrappers
│       ├── layouts/             # PublicLayout · AuthLayout · DashboardLayout
│       ├── lib/                 # Supabase client singleton
│       ├── pages/               # Route components (auth/public/student/instructor/admin)
│       ├── routes/              # AppRouter with nested layouts
│       ├── utils/               # constants · validators · helpers
│       └── main.jsx             # Entry point
│
├── supabase/                    # 🗄️ Supabase config
├── supabase-setup.sql           # 📜 Database schema + RLS policies
└── CLAUDE.md                    # 📖 Architecture guide
```

The app follows a clean **nested-layout pattern**: the router defines layouts that wrap groups of routes. Each layout renders an `<Outlet />` for its children, giving pages a consistent shell without manual prop-drilling.

<br />

## 🗄️ Database Schema

Seven tables power the platform — all defined in [`supabase-setup.sql`](./supabase-setup.sql) with **Row-Level Security** policies enforced at the database layer:

| Table | Purpose |
|:------|:--------|
| 👤 `profiles` | Linked to `auth.users`, holds `role` (student / instructor / admin) |
| 📝 `instructor_applications` | Students apply → admin approves, rejects, or revokes |
| 📚 `courses` | `instructor_id`, title, description, price, duration, status |
| 📎 `course_materials` | Files attached to courses (PDFs, ZIPs, etc.) |
| 🎟️ `enrollments` | Student ↔ Course join with `payment_status` |
| ✅ `material_progress` | Per-material completion tracking |
| 💳 `payments` | Stripe payment records |

A `handle_new_user` trigger automatically creates a `profiles` row on signup with `role = 'student'`.

**Storage buckets**: `course-images` (public) · `course-materials` (private) · `avatars` (public).

<br />

## 🚀 Getting Started

### Prerequisites

- 📦 **Node.js** 18+ and npm
- ☁️ A **Supabase** project ([supabase.com](https://supabase.com))
- 💳 A **Stripe** account for Checkout (test mode is fine)

### 1️⃣ Clone & Install

```bash
git clone https://github.com/Stiliyanss/Course-Compass.git
cd Course-Compass/client
npm install
```

### 2️⃣ Set up Supabase

Open the Supabase SQL editor and run [`supabase-setup.sql`](./supabase-setup.sql) — this creates all tables, RLS policies, and triggers. Then create the three storage buckets: `course-images`, `course-materials`, and `avatars`.

### 3️⃣ Configure Environment

Create `client/.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4️⃣ Run Locally

```bash
npm run dev      # 🟢 http://localhost:5173
```

<br />

## 📜 Available Scripts

All commands run from `client/`:

| Command | Description |
|:--------|:------------|
| `npm run dev` | 🟢 Start the Vite dev server on `http://localhost:5173` |
| `npm run build` | 📦 Build for production |
| `npm run lint` | 🧹 Run ESLint |
| `npm run preview` | 👀 Preview the production build locally |

<br />

## 🎨 Design System

Course Compass uses a **dark, glassy aesthetic** with subtle gradients and glow accents.

| Token | Value |
|:------|:------|
| 🌑 Backgrounds | `slate-950`, `slate-900` |
| ➖ Borders | `slate-800` |
| 🟣 Primary accent | `purple-400`, `purple-600` |
| 🟡 Secondary | amber & blue gradients |
| 🅰️ Text | `white`, `gray-300`, `gray-400` |
| ✨ Effects | `backdrop-blur`, `blur-3xl` glow orbs |
| 🔤 Heading font | Playfair Display (loaded from Google Fonts) |

<br />

## 🔒 Roles & Permissions

```
                ┌────────────┐
                │  visitor   │  browse courses · view details
                └─────┬──────┘
                      │ sign up
                      ▼
                ┌────────────┐
                │  student   │  enroll · pay · track progress · apply to teach
                └─────┬──────┘
                      │ application approved by admin
                      ▼
                ┌────────────┐
                │ instructor │  create courses · upload materials
                └─────┬──────┘
                      │ promoted by admin
                      ▼
                ┌────────────┐
                │   admin    │  full platform control · manage users & apps
                └────────────┘
```

Routes are guarded by `<ProtectedRoute allowedRoles={[...]} />`, and RLS policies enforce permissions at the database layer too — defense in depth.

<br />

## 🌐 Deployment

The production app is deployed on **Vercel**:

🔗 **[course-compass-ruddy.vercel.app](https://course-compass-ruddy.vercel.app/)**

To deploy your own copy: connect the repo to Vercel, set the root directory to `client/`, and add the two `VITE_SUPABASE_*` environment variables in the Vercel dashboard.

<br />

## 🤝 Contributing

Contributions are very welcome! Whether it's a bug fix, a new feature, or a typo correction:

1. 🍴 Fork the repo
2. 🌿 Create a feature branch (`git checkout -b feature/amazing-thing`)
3. 💾 Commit your changes (`git commit -m 'Add amazing thing'`)
4. 📤 Push to the branch (`git push origin feature/amazing-thing`)
5. 🎉 Open a Pull Request

<br />

## 📄 License

This project is open source. Feel free to use it as a reference for your own learning marketplaces.

<br />

---

<div align="center">

### Built with ☕ and ⌨️ by [Stiliyanss](https://github.com/Stiliyanss)

⭐ **If you like this project, consider giving it a star!** ⭐

</div>