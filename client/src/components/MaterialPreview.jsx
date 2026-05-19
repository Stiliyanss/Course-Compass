import { X, Download, FileWarning } from 'lucide-react';
import Button from './ui/Button';

/**
 * MaterialPreview — a fullscreen modal that renders a file preview.
 *
 * How it works:
 * - Receives a `material` object (title, file_type) and a `signedUrl`
 * - Based on the file_type, renders the appropriate viewer:
 *     - Videos (mp4, webm, mov) → HTML5 <video> player
 *     - PDFs → <iframe> using the browser's built-in PDF viewer
 *     - Images (jpg, png, gif, webp) → <img> tag
 *     - Office files (docx, pptx, xlsx) → Google Docs Viewer in an iframe
 *     - Unsupported types (zip, etc.) → "preview not available" message
 * - The modal has a dark backdrop with blur effect
 * - Click the X button or press Escape to close
 * - A download button is always available as a fallback
 *
 * Props:
 *   material  — { title, file_type } from the database
 *   signedUrl — temporary URL from Supabase Storage (valid for 60s)
 *   onClose   — function to close the modal
 */

// File types that can be previewed in the browser
const VIDEO_TYPES = ['mp4', 'webm', 'mov'];
const IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
const PDF_TYPES = ['pdf'];
// Office file types — previewed via Google Docs Viewer
// Google Docs Viewer can render these in an iframe by passing the file URL
// Format: https://docs.google.com/gview?url=ENCODED_URL&embedded=true
const OFFICE_TYPES = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'];

export default function MaterialPreview({ material, signedUrl, onClose }) {
  const type = material.file_type?.toLowerCase();

  const isVideo = VIDEO_TYPES.includes(type);
  const isImage = IMAGE_TYPES.includes(type);
  const isPdf = PDF_TYPES.includes(type);
  const isOffice = OFFICE_TYPES.includes(type);
  const canPreview = isVideo || isImage || isPdf || isOffice;

  // Google Docs Viewer URL — takes any public URL and renders it
  // encodeURIComponent ensures special characters in the signed URL don't break it
  const googleViewerUrl = isOffice
    ? `https://docs.google.com/gview?url=${encodeURIComponent(signedUrl)}&embedded=true`
    : null;

  // Close on Escape key press
  function handleKeyDown(e) {
    if (e.key === 'Escape') onClose();
  }

  return (
    // Backdrop — covers the entire screen with a dark, blurred overlay
    // onClick on the backdrop closes the modal (clicking outside the content)
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Modal content — stopPropagation prevents closing when clicking inside */}
      <div
        className="relative flex max-h-[90vh] w-full max-w-5xl flex-col rounded-xl border border-slate-800 bg-slate-900 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — title + close/download buttons */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3">
          <h3 className="font-semibold text-white truncate pr-4">{material.title}</h3>
          <div className="flex items-center gap-2">
            {/* Download button — always available */}
            <a href={signedUrl} download={material.title}>
              <Button variant="ghost" className="text-xs px-3 py-1 gap-1.5">
                <Download className="h-3.5 w-3.5" />
                Download
              </Button>
            </a>
            {/* Close button */}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Preview area */}
        <div className="flex-1 overflow-auto p-4">
          {isVideo && (
            // HTML5 video player with native controls (play, pause, volume, fullscreen)
            // The browser handles all playback — no external library needed
            <video
              src={signedUrl}
              controls
              className="mx-auto max-h-[75vh] rounded-lg"
            >
              Your browser does not support video playback.
            </video>
          )}

          {isPdf && (
            // iframe loads the browser's built-in PDF viewer
            // Most modern browsers (Chrome, Firefox, Edge) can render PDFs natively
            <iframe
              src={signedUrl}
              title={material.title}
              className="h-[75vh] w-full rounded-lg border border-slate-800"
            />
          )}

          {isImage && (
            // Simple image display, centered and constrained to fit the modal
            <img
              src={signedUrl}
              alt={material.title}
              className="mx-auto max-h-[75vh] rounded-lg object-contain"
            />
          )}

          {!canPreview && (
            // For file types we can't preview (docx, pptx, zip, etc.)
            // Show a message and encourage downloading instead
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <FileWarning className="h-16 w-16 text-gray-600" />
              <p className="mt-4 text-lg font-medium text-gray-400">
                Preview not available for .{type} files
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Download the file to view it on your device
              </p>
              <a href={signedUrl} download={material.title} className="mt-6">
                <Button>
                  <Download className="mr-2 h-4 w-4" />
                  Download {material.title}
                </Button>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
