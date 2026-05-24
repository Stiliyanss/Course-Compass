import { useState } from 'react';
import { X, Tag, Trash2 } from 'lucide-react';
import { isSaleActive, getSalePrice } from '../utils/sale';
import toast from 'react-hot-toast';

export default function SetSaleModal({ course, onClose, updateMutation }) {
  const hasActiveSale = isSaleActive(course);

  const [discount, setDiscount] = useState(
    hasActiveSale ? Number(course.discount_percent) : ''
  );
  const [endsAt, setEndsAt] = useState(() => {
    if (hasActiveSale && course.sale_ends_at) {
      // Convert UTC to local datetime-local format
      const d = new Date(course.sale_ends_at);
      const offset = d.getTimezoneOffset();
      const local = new Date(d.getTime() - offset * 60000);
      return local.toISOString().slice(0, 16);
    }
    return '';
  });

  const discountNum = Number(discount) || 0;
  const originalPrice = Number(course.price);
  const previewPrice = discountNum > 0
    ? Math.round(originalPrice * (1 - discountNum / 100) * 100) / 100
    : originalPrice;

  // Min datetime = now in local format
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localNow = new Date(now.getTime() - offset * 60000);
  const minDateTime = localNow.toISOString().slice(0, 16);

  function handleApply() {
    if (discountNum < 1 || discountNum > 99) {
      toast.error('Discount must be between 1% and 99%');
      return;
    }
    if (!endsAt) {
      toast.error('Please set an end date');
      return;
    }
    const endDate = new Date(endsAt);
    if (endDate <= new Date()) {
      toast.error('End date must be in the future');
      return;
    }

    updateMutation.mutate(
      { id: course.id, discount_percent: discountNum, sale_ends_at: endDate.toISOString() },
      {
        onSuccess: () => {
          toast.success('Sale applied!');
          onClose();
        },
        onError: (err) => toast.error(err.message),
      }
    );
  }

  function handleRemove() {
    updateMutation.mutate(
      { id: course.id, discount_percent: 0, sale_ends_at: null },
      {
        onSuccess: () => {
          toast.success('Sale removed');
          onClose();
        },
        onError: (err) => toast.error(err.message),
      }
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Tag className="h-5 w-5 text-green-400" />
              Set Sale
            </h3>
            <p className="text-sm text-gray-400 truncate mt-0.5">{course.title}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Live price preview */}
          <div className="rounded-xl border border-slate-800 bg-slate-800/30 p-4 text-center">
            {discountNum > 0 ? (
              <>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-lg text-gray-500 line-through">${originalPrice.toFixed(2)}</span>
                  <span className="text-2xl font-bold text-green-400">${previewPrice.toFixed(2)}</span>
                </div>
                <span className="inline-block mt-2 rounded-full bg-green-500/20 border border-green-500/30 px-2.5 py-0.5 text-xs font-bold text-green-400">
                  {discountNum}% OFF
                </span>
              </>
            ) : (
              <span className="text-2xl font-bold text-white">${originalPrice.toFixed(2)}</span>
            )}
          </div>

          {/* Discount input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Discount Percentage</label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="99"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="e.g. 25"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 pr-10 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">%</span>
            </div>
          </div>

          {/* End date input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Sale Ends At</label>
            <input
              type="datetime-local"
              value={endsAt}
              min={minDateTime}
              onChange={(e) => setEndsAt(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-white focus:border-purple-500 focus:outline-none [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 px-6 py-4">
          {hasActiveSale ? (
            <button
              onClick={handleRemove}
              disabled={updateMutation.isPending}
              className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove Sale
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={handleApply}
            disabled={updateMutation.isPending}
            className="rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-500 transition-colors disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Saving...' : 'Apply Sale'}
          </button>
        </div>
      </div>
    </div>
  );
}
