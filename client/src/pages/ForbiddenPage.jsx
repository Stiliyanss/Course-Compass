import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <h1 className="text-6xl font-bold text-gray-900">403</h1>
      <p className="mt-4 text-lg text-gray-600">You don&apos;t have access to this page</p>
      <Link to="/" className="mt-6">
        <Button>Go Home</Button>
      </Link>
    </div>
  );
}
