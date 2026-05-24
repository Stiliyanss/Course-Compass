import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getTimeRemaining } from '../utils/sale';
import { Clock } from 'lucide-react';

export default function SaleCountdown({ saleEndsAt, size = 'sm' }) {
  const queryClient = useQueryClient();
  const [remaining, setRemaining] = useState(() => getTimeRemaining(saleEndsAt));

  useEffect(() => {
    const id = setInterval(() => {
      const r = getTimeRemaining(saleEndsAt);
      if (!r) {
        clearInterval(id);
        setRemaining(null);
        queryClient.invalidateQueries({ queryKey: ['courses'] });
        queryClient.invalidateQueries({ queryKey: ['course'] });
        return;
      }
      setRemaining(r);
    }, 1000);

    return () => clearInterval(id);
  }, [saleEndsAt, queryClient]);

  if (!remaining) return null;

  const pad = (n) => String(n).padStart(2, '0');

  const timeStr = remaining.days > 0
    ? `${remaining.days}d ${pad(remaining.hours)}h ${pad(remaining.minutes)}m`
    : `${pad(remaining.hours)}h ${pad(remaining.minutes)}m ${pad(remaining.seconds)}s`;

  const isUrgent = remaining.days === 0 && remaining.hours < 2;
  const textColor = isUrgent ? 'text-red-400' : 'text-amber-400';
  const textSize = size === 'lg' ? 'text-sm' : 'text-xs';

  return (
    <div className={`flex items-center gap-1 ${textColor} ${textSize}`}>
      <Clock className={size === 'lg' ? 'h-3.5 w-3.5' : 'h-3 w-3'} />
      <span className="font-medium">{timeStr} left</span>
    </div>
  );
}
