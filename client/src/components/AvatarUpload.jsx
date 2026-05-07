import { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { uploadAvatar } from '../api/users';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

/**
 * Clickable avatar that opens a file picker for uploading a profile photo.
 *
 * How it works:
 * - Shows the current avatar or a first-letter fallback
 * - Clicking opens a hidden <input type="file">
 * - On file select: validates, shows preview, uploads to Supabase
 * - On success: updates the profile in AuthContext so the UI reflects the change
 *
 * @param {string} size — 'sm' (36px), 'md' (48px), or 'lg' (80px)
 */
export default function AvatarUpload({ size = 'md' }) {
  const { profile, refreshProfile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const inputRef = useRef(null);

  const sizes = {
    sm: 'h-9 w-9 text-sm',
    md: 'h-12 w-12 text-base',
    lg: 'h-20 w-20 text-2xl',
  };

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB');
      return;
    }

    // Show instant preview using a local object URL
    setPreview(URL.createObjectURL(file));

    setUploading(true);
    try {
      await uploadAvatar(file);
      await refreshProfile();
      toast.success('Avatar updated!');
    } catch (err) {
      toast.error(err.message || 'Failed to upload avatar');
      // Revert preview on failure
      setPreview(null);
    } finally {
      setUploading(false);
      // Reset input so the same file can be re-selected
      e.target.value = '';
    }
  }

  const imageUrl = preview || profile?.avatar_url;
  const initial = profile?.full_name?.charAt(0)?.toUpperCase() || '?';

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      disabled={uploading}
      className={`relative group rounded-full overflow-hidden border-2 border-slate-700 hover:border-purple-500 transition-colors ${sizes[size]} shrink-0`}
    >
      {/* Avatar image or letter fallback */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={profile?.full_name || 'Avatar'}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-purple-600/20 font-bold text-purple-400">
          {initial}
        </div>
      )}

      {/* Hover overlay with camera icon */}
      {uploading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <Loader2 className="h-4 w-4 animate-spin text-white" />
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera className="h-4 w-4 text-white" />
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </button>
  );
}
