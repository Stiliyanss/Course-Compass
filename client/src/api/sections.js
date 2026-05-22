import { supabase } from '../lib/supabaseClient';

/**
 * Fetch all sections for a course, ordered by order_index.
 * Each section includes its materials (files), also ordered.
 *
 * The query does two things:
 * 1. Fetches sections from course_sections
 * 2. Joins course_materials via the section_id foreign key
 *
 * Result shape:
 * [
 *   {
 *     id: '...', title: 'Week 1', order_index: 0,
 *     materials: [
 *       { id: '...', title: 'Lecture.pptx', file_url: '...', file_type: 'pptx' },
 *       ...
 *     ]
 *   },
 *   ...
 * ]
 */
export async function fetchSections(courseId) {
  const { data, error } = await supabase
    .from('course_sections')
    .select('*, materials:course_materials(*)')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });

  if (error) throw error;

  // Sort materials within each section by order_index
  return data.map((section) => ({
    ...section,
    materials: (section.materials || []).sort((a, b) => a.order_index - b.order_index),
  }));
}

/**
 * Create a new section in a course.
 * The order_index is set to put it at the end.
 *
 * @param {string} courseId — the course this section belongs to
 * @param {string} title — section title (e.g. "Week 1: Introduction")
 * @param {number} orderIndex — position in the section list
 */
export async function createSection(courseId, title, orderIndex) {
  const { data, error } = await supabase
    .from('course_sections')
    .insert({
      course_id: courseId,
      title,
      order_index: orderIndex,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update a section's title.
 */
export async function updateSection(id, title) {
  const { data, error } = await supabase
    .from('course_sections')
    .update({ title })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a section and all its materials.
 * ON DELETE CASCADE in the schema handles material cleanup.
 */
export async function deleteSection(id) {
  const { error } = await supabase
    .from('course_sections')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Upload a material file to Supabase Storage and create a
 * course_materials row linking it to a section.
 *
 * How it works:
 * 1. Upload the file to the 'course-materials' storage bucket
 *    Path: {courseId}/{sectionId}/{timestamp}_{filename}
 *    Using a timestamp prefix prevents name collisions if the
 *    same filename is uploaded twice.
 * 2. Get the public URL (bucket is private, but we'll use
 *    signed URLs or the authenticated client to access them)
 * 3. Create a row in course_materials with the file info
 *
 * @param {Object} params
 * @param {string} params.courseId — for the storage path
 * @param {string} params.sectionId — which section this material belongs to
 * @param {File} params.file — the file object from a file input
 * @param {string} params.title — display name for the material
 * @param {number} params.orderIndex — position within the section
 */
export async function uploadMaterial({ courseId, sectionId, file, title, orderIndex }) {
  // Build a unique storage path
  const timestamp = Date.now();
  const filePath = `${courseId}/${sectionId}/${timestamp}_${file.name}`;

  // Step 1: Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('course-materials')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  // Step 2: Get the file URL
  // Since course-materials is a private bucket, we store the path
  // and generate signed URLs when students need to download
  const fileUrl = filePath;

  // Step 3: Determine file type from extension
  const ext = file.name.split('.').pop().toLowerCase();

  // Step 4: Create the database row
  const { data, error } = await supabase
    .from('course_materials')
    .insert({
      course_id: courseId,
      section_id: sectionId,
      title,
      file_url: fileUrl,
      file_type: ext,
      order_index: orderIndex,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a material — removes the database row and the stored file.
 *
 * @param {string} id — the material's UUID
 * @param {string} fileUrl — the storage path to delete
 */
export async function deleteMaterial(id, fileUrl) {
  // Delete from storage first
  const { error: storageError } = await supabase.storage
    .from('course-materials')
    .remove([fileUrl]);

  if (storageError) console.error('Storage delete failed:', storageError);

  // Delete the database row
  const { error } = await supabase
    .from('course_materials')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Reorder materials within a section.
 *
 * Receives an array of { id, order_index } objects and updates
 * each material's position in the database.
 *
 * We update each row individually because Supabase's .upsert()
 * would require sending all columns, not just the order_index.
 *
 * @param {Array} items — [{ id: 'uuid', order_index: 0 }, ...]
 */
export async function reorderMaterials(items) {
  const updates = items.map(({ id, order_index }) =>
    supabase
      .from('course_materials')
      .update({ order_index })
      .eq('id', id)
  );

  const results = await Promise.all(updates);

  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}
