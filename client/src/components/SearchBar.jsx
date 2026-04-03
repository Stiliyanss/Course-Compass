import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

export default function SearchBar({ onSearch, placeholder = 'Search courses...' }) {
  const [value, setValue] = useState('');

  useEffect(() => {
    // Set a timer that fires 400ms after the user stops typing
    const timer = setTimeout(() => {
      onSearch(value);
    }, 400);

    // If the user types again before 400ms, cancel the old timer
    // and start a new one. This is the "debounce" effect.
    return () => clearTimeout(timer);
  }, [value, onSearch]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
      />
    </div>
  );
}
