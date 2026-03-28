# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Course Compass is a web platform for finding courses. It is a client-only React application backed by Supabase (hosted PostgreSQL + auth + API).

## Commands

All commands run from the `client/` directory:

```bash
npm run dev      # Start Vite dev server (http://localhost:5173)
npm run build    # Production build
npm run lint     # ESLint
npm run preview  # Preview production build
```

## Architecture

- **client/src/** — all application code lives here
  - `main.jsx` — React DOM entry point, imports global styles
  - `App.jsx` — root component
  - `lib/supabaseClient.js` — single Supabase client instance, used throughout the app
  - `api/` — Supabase query functions
  - `components/` — reusable UI components
  - `context/` — React Context providers
  - `hooks/` — custom React hooks
  - `layouts/` — page layout wrappers
  - `pages/` — route-level page components
  - `routes/` — React Router configuration
  - `utils/` — helper functions

## Tech Stack

- **React 19** with JSX (not TypeScript)
- **Vite 8** for builds
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin (no tailwind.config.js — uses CSS-based config with `@import "tailwindcss"`)
- **Supabase** for database, auth, and API (`@supabase/supabase-js`)
- **React Router v7** for routing
- **TanStack Query (React Query)** for server state management
- **React Hook Form + Zod** for form handling and validation
- **Lucide React** for icons
- **react-hot-toast** for notifications
- **clsx** for conditional class names
- **date-fns** for date formatting

## Environment Variables

Defined in `client/.env` (prefixed with `VITE_` for Vite exposure):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
