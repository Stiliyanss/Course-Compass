import { Link, useLocation } from 'react-router-dom';
import { Compass, LayoutDashboard, BookOpen, GraduationCap, Users, FileText, ClipboardList, X, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/constants';
import { clsx } from 'clsx';

const studentLinks = [
  { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/student/my-courses', label: 'My Courses', icon: BookOpen },
  { to: '/student/wishlist', label: 'Wishlist', icon: Heart },
  { to: '/student/apply-instructor', label: 'Become Instructor', icon: GraduationCap },
];

const instructorLinks = [
  { to: '/instructor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/instructor/courses', label: 'Manage Courses', icon: BookOpen },
];

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/courses', label: 'Courses', icon: BookOpen },
  { to: '/admin/applications', label: 'Applications', icon: ClipboardList },
];

export default function Sidebar({ open, onClose }) {
  const { profile } = useAuth();
  const location = useLocation();

  function getLinks() {
    if (profile?.role === ROLES.ADMIN) return adminLinks;
    if (profile?.role === ROLES.INSTRUCTOR) return instructorLinks;
    return studentLinks;
  }

  const links = getLinks();

  return (
    <>
      {/* Overlay — mobile only */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800 bg-slate-900 transition-transform duration-300 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo + close button */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
          <Link
            to="/"
            className="flex items-center gap-2 text-xl font-bold text-white"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            <Compass className="h-6 w-6" />
            Course Compass
          </Link>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {links.map((link) => {
            const isActive = location.pathname === link.to;

            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-purple-600/20 text-purple-400 border-l-2 border-purple-400'
                    : 'text-gray-400 hover:text-white hover:bg-slate-800'
                )}
              >
                <link.icon className="h-5 w-5" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
