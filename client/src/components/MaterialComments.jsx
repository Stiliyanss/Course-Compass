import { useState } from 'react';
import { useComments, useCreateComment, useDeleteComment } from '../hooks/useComments';
import { useAuth } from '../context/AuthContext';
import { X, Send, Trash2, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Spinner from './ui/Spinner';

/**
 * MaterialComments — a slide-out panel showing comments for a specific material.
 *
 * Props:
 *   material   — { id, title } from the database
 *   onClose    — function to close the panel
 */
export default function MaterialComments({ material, onClose }) {
  const { user, profile } = useAuth();
  const { data: comments, isLoading } = useComments(material.id);
  const createMutation = useCreateComment();
  const deleteMutation = useDeleteComment(material.id);

  const [text, setText] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;

    createMutation.mutate(
      { materialId: material.id, content: text },
      { onSuccess: () => setText('') }
    );
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') onClose();
  }

  const isInstructorOrAdmin = profile?.role === 'instructor' || profile?.role === 'admin';

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Panel */}
      <div
        className="flex h-full w-full max-w-lg flex-col bg-slate-900 border-l border-slate-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-purple-400 mb-1">
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Comments</span>
            </div>
            <h3 className="font-semibold text-white truncate">{material.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="py-10">
              <Spinner size="md" />
            </div>
          ) : comments?.length === 0 ? (
            <div className="py-10 text-center">
              <MessageCircle className="mx-auto h-10 w-10 text-gray-700" />
              <p className="mt-3 text-sm text-gray-500">No comments yet</p>
              <p className="mt-1 text-xs text-gray-600">Be the first to share your thoughts</p>
            </div>
          ) : (
            comments?.map((comment) => (
              <CommentBubble
                key={comment.id}
                comment={comment}
                isOwn={comment.user_id === user?.id}
                canDelete={comment.user_id === user?.id || isInstructorOrAdmin}
                onDelete={() => deleteMutation.mutate(comment.id)}
                isDeleting={deleteMutation.isPending}
              />
            ))
          )}
        </div>

        {/* Input */}
        {user && (
          <form
            onSubmit={handleSubmit}
            className="border-t border-slate-800 p-4"
          >
            <div className="flex items-end gap-2">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Write a comment..."
                rows={2}
                className="flex-1 resize-none rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
              <button
                type="submit"
                disabled={!text.trim() || createMutation.isPending}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-600 text-white hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createMutation.isPending ? (
                  <Spinner size="sm" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="mt-1.5 text-[11px] text-gray-600">
              Press Enter to send, Shift+Enter for new line
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

function CommentBubble({ comment, isOwn, canDelete, onDelete, isDeleting }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const roleBadge = {
    instructor: { text: 'Instructor', style: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
    admin: { text: 'Admin', style: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  };

  const badge = roleBadge[comment.user?.role];

  return (
    <div className={`group rounded-xl border border-slate-800 bg-slate-800/50 p-4 ${isOwn ? 'border-purple-500/20' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {comment.user?.avatar_url ? (
            <img
              src={comment.user.avatar_url}
              alt={comment.user.full_name}
              className="h-7 w-7 rounded-full object-cover border border-slate-700"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-600/20 text-xs font-bold text-purple-400">
              {comment.user?.full_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
          <span className="text-sm font-medium text-white truncate">
            {comment.user?.full_name || 'Unknown'}
          </span>
          {badge && (
            <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${badge.style}`}>
              {badge.text}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-gray-600 whitespace-nowrap">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>

          {canDelete && (
            <>
              {confirmDelete ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      onDelete();
                      setConfirmDelete(false);
                    }}
                    disabled={isDeleting}
                    className="rounded px-1.5 py-0.5 text-[10px] font-medium text-red-400 bg-red-400/10 hover:bg-red-400/20 transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="rounded px-1.5 py-0.5 text-[10px] font-medium text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="rounded-lg p-1 text-gray-600 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-slate-700 transition-all"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <p className="text-sm text-gray-300 whitespace-pre-line leading-relaxed">
        {comment.content}
      </p>
    </div>
  );
}
