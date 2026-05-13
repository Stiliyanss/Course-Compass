import { Link } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import Button from '../components/ui/Button';

export default function ForbiddenPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <ShieldX className="h-16 w-16 text-red-400" />
      <h1 className="mt-4 text-5xl font-bold text-white">403</h1>
      <p className="mt-3 text-lg text-gray-400">You don&apos;t have access to this page</p>
      <Link to="/" className="mt-6">
        <Button>Go Home</Button>
      </Link>
    </div>
  );
}
