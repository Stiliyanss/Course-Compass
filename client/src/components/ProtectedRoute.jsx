import { Navigate, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldX } from 'lucide-react';
import Spinner from './ui/Spinner';
import Button from './ui/Button';

export default function ProtectedRoute({ allowedRoles }) {
  const { user, profile, loading } = useAuth();

  // Auth state is still loading
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <Spinner size="lg" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // User is logged in but profile hasn't loaded yet — show spinner briefly
  // This happens because profile is fetched in the background after auth loads
  if (!profile) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <Spinner size="lg" />
      </div>
    );
  }

  // Wrong role — show forbidden page inline
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4">
        <ShieldX className="h-16 w-16 text-red-400" />
        <h1 className="mt-4 text-5xl font-bold text-white">403</h1>
        <p className="mt-3 text-lg text-gray-400">You don&apos;t have access to this page</p>
        <Link to="/" className="mt-6">
          <Button>Go Home</Button>
        </Link>
      </div>
    );
  }

  return <Outlet />;
}
