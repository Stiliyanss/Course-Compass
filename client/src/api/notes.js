import { supabase } from '../lib/supabaseClient';

/**
 * Fetch all of the current student's notes for a given course.
 *
 * Since notes are linked to sections (not courses directly),
 * we first need the section IDs for this course, then fetch
 * notes matching those section IDs.
 *
 * Returns an object keyed by section_id for easy lookup:
 * { "section-uuid-1": "my notes here", "section-uuid-2": "more notes" }
 */
export async function fetchNotes(courseId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};

  // Get all section IDs for this course
  const { data: sections, error: sectionsError } = await supabase
    .from('course_sections')
    .select('id')
    .eq('course_id', courseId);

  if (sectionsError) throw sectionsError;
  if (!sections || sections.length === 0) return {};

  const sectionIds = sections.map((s) => s.id);

  // Fetch notes for these sections
  const { data: notes, error } = await supabase
    .from('section_notes')
    .select('section_id, content')
    .eq('student_id', user.id)
    .in('section_id', sectionIds);

  if (error) throw error;

  // Convert array to object keyed by section_id
  // This makes it easy to look up: notes["section-uuid"] → "note content"
  const notesMap = {};
  notes.forEach((note) => {
    notesMap[note.section_id] = note.content;
  });

  return notesMap;
}

/**
 * Save a note for a specific section.
 *
 * Uses upsert — if a note already exists for this student + section,
 * it updates the content. If not, it creates a new one.
 *
 * upsert works with our UNIQUE(student_id, section_id) constraint:
 * - If no row exists with this student_id + section_id → INSERT
 * - If a row already exists → UPDATE the content and updated_at
 */
export async function saveNote(sectionId, content) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('section_notes')
    .upsert(
      {
        student_id: user.id,
        section_id: sectionId,
        content,
        updated_at: new Date().toISOString(),
      },
      {
        // onConflict tells upsert which columns to check for duplicates
        onConflict: 'student_id,section_id',
      }
    );

  if (error) throw error;
}
