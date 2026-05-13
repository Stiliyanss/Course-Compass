import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import Button from '../components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4">
      <Compass className="h-16 w-16 text-purple-400" />
      <h1 className="mt-4 text-5xl font-bold text-white">404</h1>
      <p className="mt-3 text-lg text-gray-400">Page not found</p>
      <Link to="/" className="mt-6">
        <Button>Go Home</Button>
      </Link>
    </div>
  );
}
