import { clsx } from 'clsx';

export default function Input({
  label,
  error,
  className = '',
  ...props
}) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-300">
          {label}
        </label>
      )}
      <input
        className={clsx(
          'w-full rounded-lg border bg-slate-800 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none transition-colors',
          error
            ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
            : 'border-slate-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500',
          className
        )}
        {...props}
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
