import { Link, useNavigate } from 'react-router-dom';
import { Compass, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getDashboardLink } from '../utils/getDashboardLink';
import Button from './ui/Button';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    try {
      await signOut();
      toast.success('Signed out');
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Failed to sign out');
    }
  }

  return (
    <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 text-2xl font-bold text-white"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          <Compass className="h-7 w-7" />
          Course Compass
        </Link>

        {/* Right side: nav links + auth */}
        <div className="flex items-center gap-4">
          <Link to="/courses" className="text-sm text-gray-400 hover:text-white transition-colors">
            Courses
          </Link>

          {user ? (
            <>
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
      </div>
    </nav>
  );
}
