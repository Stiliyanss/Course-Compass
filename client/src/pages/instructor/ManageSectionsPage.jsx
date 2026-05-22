import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useSections,
  useCreateSection,
  useUpdateSection,
  useDeleteSection,
  useUploadMaterial,
  useDeleteMaterial,
  useReorderMaterials,
} from '../../hooks/useSections';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  FileText,
  FileVideo,
  FileImage,
  File,
  Pencil,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  GripVertical,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

// Map file extensions to icons and labels
const FILE_ICONS = {
  pdf: { icon: FileText, color: 'text-red-400' },
  doc: { icon: FileText, color: 'text-blue-400' },
  docx: { icon: FileText, color: 'text-blue-400' },
  ppt: { icon: FileImage, color: 'text-orange-400' },
  pptx: { icon: FileImage, color: 'text-orange-400' },
  mp4: { icon: FileVideo, color: 'text-purple-400' },
  mov: { icon: FileVideo, color: 'text-purple-400' },
  avi: { icon: FileVideo, color: 'text-purple-400' },
  webm: { icon: FileVideo, color: 'text-purple-400' },
  png: { icon: FileImage, color: 'text-green-400' },
  jpg: { icon: FileImage, color: 'text-green-400' },
  jpeg: { icon: FileImage, color: 'text-green-400' },
  zip: { icon: File, color: 'text-amber-400' },
  rar: { icon: File, color: 'text-amber-400' },
};

function getFileIcon(fileType) {
  return FILE_ICONS[fileType] || { icon: File, color: 'text-gray-400' };
}

export default function ManageSectionsPage() {
  const { id: courseId } = useParams();
  const navigate = useNavigate();

  const { data: sections, isLoading } = useSections(courseId);
  const createSectionMutation = useCreateSection();

  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [showNewSection, setShowNewSection] = useState(false);

  function handleCreateSection(e) {
    e.preventDefault();
    if (!newSectionTitle.trim()) return;

    createSectionMutation.mutate(
      {
        courseId,
        title: newSectionTitle.trim(),
        orderIndex: sections?.length || 0,
      },
      {
        onSuccess: () => {
          toast.success('Section created');
          setNewSectionTitle('');
          setShowNewSection(false);
        },
        onError: (err) => toast.error(err.message),
      }
    );
  }

  if (isLoading) {
    return (
      <div className="py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/instructor/courses')}
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to courses
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-2xl font-bold text-white md:text-3xl"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Course Content
            </h1>
            <p className="mt-1 text-gray-400">
              Organize your course into sections and upload materials
            </p>
          </div>

          <Button onClick={() => setShowNewSection(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Section
          </Button>
        </div>
      </div>

      {/* New section form */}
      {showNewSection && (
        <form
          onSubmit={handleCreateSection}
          className="mb-6 flex items-center gap-3 rounded-xl border border-purple-500/30 bg-purple-500/5 p-4"
        >
          <input
            type="text"
            value={newSectionTitle}
            onChange={(e) => setNewSectionTitle(e.target.value)}
            placeholder="Section title (e.g. Week 1: Introduction)"
            autoFocus
            className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
          <Button type="submit" loading={createSectionMutation.isPending}>
            Create
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setShowNewSection(false);
              setNewSectionTitle('');
            }}
          >
            Cancel
          </Button>
        </form>
      )}

      {/* Sections list */}
      {(!sections || sections.length === 0) ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-12 text-center">
          <FileText className="mx-auto h-10 w-10 text-gray-600" />
          <p className="mt-3 text-gray-400">No sections yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Add a section to start organizing your course content
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((section, index) => (
            <SectionCard
              key={section.id}
              section={section}
              courseId={courseId}
              sectionNumber={index + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SectionCard({ section, courseId, sectionNumber }) {
  const updateMutation = useUpdateSection();
  const deleteMutation = useDeleteSection();
  const uploadMutation = useUploadMaterial();
  const deleteMaterialMutation = useDeleteMaterial();
  const reorderMutation = useReorderMaterials();

  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(section.title);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileInputRef = useRef(null);

  // dnd-kit sensor — PointerSensor with a small activation distance
  // This prevents accidental drags when clicking buttons (delete, etc.)
  // The user must drag at least 5px before the drag starts
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  /**
   * Called when the user drops a material in a new position.
   *
   * How it works:
   * 1. active = the item being dragged (has an id)
   * 2. over = the item it was dropped on (has an id)
   * 3. arrayMove rearranges the array — moves the item from oldIndex to newIndex
   * 4. We save the new order to the database
   */
  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const materials = section.materials || [];
    const oldIndex = materials.findIndex((m) => m.id === active.id);
    const newIndex = materials.findIndex((m) => m.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Rearrange the array
    const reordered = arrayMove(materials, oldIndex, newIndex);

    // Save new positions — each item gets its array index as order_index
    const updates = reordered.map((m, i) => ({ id: m.id, order_index: i }));
    reorderMutation.mutate(updates, {
      onError: (err) => toast.error('Failed to reorder: ' + err.message),
    });
  }

  function handleUpdateTitle() {
    if (!editTitle.trim() || editTitle.trim() === section.title) {
      setIsEditing(false);
      setEditTitle(section.title);
      return;
    }

    updateMutation.mutate(
      { id: section.id, title: editTitle.trim() },
      {
        onSuccess: () => {
          toast.success('Section renamed');
          setIsEditing(false);
        },
        onError: (err) => toast.error(err.message),
      }
    );
  }

  function handleDeleteSection() {
    deleteMutation.mutate(
      { id: section.id },
      {
        onSuccess: () => toast.success('Section deleted'),
        onError: (err) => toast.error(err.message),
      }
    );
  }

  function handleFileUpload(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Upload each file
    files.forEach((file, i) => {
      // Use the filename without extension as the title
      const title = file.name.split('.').slice(0, -1).join('.');

      uploadMutation.mutate(
        {
          courseId,
          sectionId: section.id,
          file,
          title,
          orderIndex: (section.materials?.length || 0) + i,
        },
        {
          onSuccess: () => toast.success(`Uploaded: ${file.name}`),
          onError: (err) => toast.error(`Failed: ${file.name} — ${err.message}`),
        }
      );
    });

    // Reset input so the same files can be re-selected
    e.target.value = '';
  }

  function handleDeleteMaterial(material) {
    deleteMaterialMutation.mutate(
      { id: material.id, fileUrl: material.file_url },
      {
        onSuccess: () => toast.success('Material deleted'),
        onError: (err) => toast.error(err.message),
      }
    );
  }

  const Arrow = isOpen ? ChevronDown : ChevronRight;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
      {/* Section header */}
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-800">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Arrow className="h-5 w-5" />
          </button>

          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-600/20 text-xs font-bold text-purple-400">
            {sectionNumber}
          </span>

          {isEditing ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUpdateTitle();
                  if (e.key === 'Escape') {
                    setIsEditing(false);
                    setEditTitle(section.title);
                  }
                }}
                autoFocus
                className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-sm text-white outline-none focus:border-purple-500"
              />
              <button onClick={handleUpdateTitle} className="text-green-400 hover:text-green-300">
                <Check className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditTitle(section.title);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <h3 className="font-semibold text-white truncate">{section.title}</h3>
          )}
        </div>

        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 mr-2">
            {section.materials?.length || 0} file{(section.materials?.length || 0) !== 1 ? 's' : ''}
          </span>

          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="rounded-lg p-1.5 text-gray-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}

          {confirmDelete ? (
            <div className="flex items-center gap-2 ml-2">
              <span className="text-xs text-gray-400">Delete?</span>
              <Button
                variant="danger"
                onClick={handleDeleteSection}
                loading={deleteMutation.isPending}
                className="text-xs px-2 py-1"
              >
                Yes
              </Button>
              <Button
                variant="ghost"
                onClick={() => setConfirmDelete(false)}
                className="text-xs px-2 py-1"
              >
                No
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="rounded-lg p-1.5 text-gray-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Section content — materials list + upload */}
      {isOpen && (
        <div className="px-5 py-4">
          {/* Materials list — wrapped in drag and drop context */}
          {section.materials?.length > 0 && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={section.materials.map((m) => m.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2 mb-4">
                  {section.materials.map((material) => (
                    <SortableMaterialRow
                      key={material.id}
                      material={material}
                      onDelete={() => handleDeleteMaterial(material)}
                      isDeleting={deleteMaterialMutation.isPending}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {/* Upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-700 px-4 py-3 text-sm text-gray-400 hover:border-purple-500/50 hover:text-gray-300 transition-colors disabled:opacity-50"
          >
            {uploadMutation.isPending ? (
              <>
                <Spinner size="sm" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload files (PPT, Word, PDF, Video, etc.)
              </>
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.mov,.avi,.webm,.zip,.rar,.png,.jpg,.jpeg"
          />
        </div>
      )}
    </div>
  );
}

/**
 * SortableMaterialRow — a material row that can be dragged to reorder.
 *
 * Uses @dnd-kit's useSortable hook which provides:
 * - attributes & listeners: attach to the drag handle element
 * - setNodeRef: attach to the row's DOM element so dnd-kit can track it
 * - transform: the current drag offset (how far the item has moved)
 * - transition: CSS transition for smooth animation
 * - isDragging: true while this item is being dragged
 */
function SortableMaterialRow({ material, onDelete, isDeleting }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { icon: Icon, color } = getFileIcon(material.file_type);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: material.id });

  // Apply the drag transform as inline styles
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    // While dragging: raise above other items and add a glow effect
    zIndex: isDragging ? 10 : undefined,
    position: isDragging ? 'relative' : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between gap-3 rounded-lg bg-slate-800/50 px-4 py-3 ${
        isDragging
          ? 'shadow-[0_0_15px_rgba(168,85,247,0.3)] border border-purple-500/30 bg-slate-800'
          : ''
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Drag handle — the grip icon that the user grabs to drag */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none text-gray-600 hover:text-gray-400 transition-colors active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <Icon className={`h-5 w-5 shrink-0 ${color}`} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">{material.title}</p>
          <p className="text-xs text-gray-500 uppercase">{material.file_type}</p>
        </div>
      </div>

      {confirmDelete ? (
        <div className="flex items-center gap-2">
          <Button
            variant="danger"
            onClick={() => {
              onDelete();
              setConfirmDelete(false);
            }}
            loading={isDeleting}
            className="text-xs px-2 py-1"
          >
            Yes
          </Button>
          <Button
            variant="ghost"
            onClick={() => setConfirmDelete(false)}
            className="text-xs px-2 py-1"
          >
            No
          </Button>
        </div>
      ) : (
        <button
          onClick={() => setConfirmDelete(true)}
          className="rounded-lg p-1.5 text-gray-400 hover:text-red-400 hover:bg-slate-700 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
