import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

export default function Spinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex items-center justify-center">
      <Loader2 className={clsx('animate-spin text-blue-600', sizes[size], className)} />
    </div>
  );
}
