import { Outlet } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import toast from 'react-hot-toast';

export default function DashboardLayout() {
  const { profile, signOut } = useAuth();
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

  // Capitalize first letter of role for display (e.g. "student" → "Student")
  const roleLabel = profile?.role
    ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
    : '';

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Sidebar — fixed on the left */}
      <Sidebar />

      {/* Right side — top bar + page content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-4">
          {/* User info */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-white">
              {profile?.full_name || 'User'}
            </span>
            <span className="rounded-full bg-purple-600/20 px-2.5 py-0.5 text-xs font-medium text-purple-400">
              {roleLabel}
            </span>
          </div>

          {/* Sign out button */}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </header>

        {/* Page content — scrollable */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
