import { Link, Outlet } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-950 px-4">
      {/* Background glow orbs — decorative blurred circles */}
      <div className="absolute top-1/4 left-1/3 h-80 w-80 rounded-full bg-purple-600/15 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/3 h-64 w-64 rounded-full bg-blue-600/10 blur-3xl" />

      {/* Glass card container */}
      <div className="relative w-full max-w-md space-y-8 rounded-xl border border-slate-800 bg-slate-900/70 p-8 backdrop-blur-sm">
        {/* Logo — links back to home page */}
        <div className="text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xl font-bold text-white"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            <Compass className="h-6 w-6" />
            Course Compass
          </Link>
        </div>

        {/* Page content (LoginPage, RegisterPage, etc.) renders here */}
        <Outlet />
      </div>
    </div>
  );
}
