import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getDashboardLink } from '../utils/getDashboardLink';
import Button from './ui/Button';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSignOut() {
    try {
      await signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
    window.location.href = '/login';
  }

  return (
    <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 text-xl font-bold text-white sm:text-2xl"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          <Compass className="h-6 w-6 sm:h-7 sm:w-7" />
          Course Compass
        </Link>

        {/* Desktop nav — hidden on mobile */}
        <div className="hidden items-center gap-4 md:flex">
          <Link to="/courses" className="text-sm text-gray-400 hover:text-white transition-colors">
            Courses
          </Link>

          {user ? (
            <>
              <Link to="/student/my-courses" className="text-sm text-gray-400 hover:text-white transition-colors">
                My Courses
              </Link>
              <Link to={getDashboardLink(profile?.role)}>
                <Button variant="primary" className="text-sm">
                  Dashboard
                </Button>
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link to="/register">
                <Button className="text-sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>

        {/* Hamburger — mobile only */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="rounded-lg p-1 text-gray-400 hover:text-white md:hidden"
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div className="border-t border-slate-800 bg-slate-950 px-4 pb-4 md:hidden">
          <div className="flex flex-col gap-3 pt-3">
            <Link
              to="/courses"
              onClick={() => setMenuOpen(false)}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Courses
            </Link>

            {user ? (
              <>
                <Link
                  to="/student/my-courses"
                  onClick={() => setMenuOpen(false)}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  My Courses
                </Link>
                <Link
                  to={getDashboardLink(profile?.role)}
                  onClick={() => setMenuOpen(false)}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => { setMenuOpen(false); handleSignOut(); }}
                  className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
