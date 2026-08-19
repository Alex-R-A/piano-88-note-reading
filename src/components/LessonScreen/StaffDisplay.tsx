// components/LessonScreen/StaffDisplay.tsx
import { useMemo, useRef } from 'react';
import { useVexFlow, computeStaffFrame } from '@/hooks';
import { getClefForNote } from '@/utils/noteUtils';
import type { NoteId } from '@/types';

interface StaffDisplayProps {
  noteId: NoteId | null;
  /**
   * Every note this lesson can display. The staff's drawing window is sized
   * once for the whole set, so the five lines hold one fixed position while
   * the notes move around them.
   */
  noteSet?: NoteId[];
}

/**
 * Renders a musical staff with the given note using VexFlow.
 * Clef selection: octave >= 4 -> treble, else bass.
 * Clef at 50% opacity, note at 100% opacity.
 */
export function StaffDisplay({ noteId, noteSet }: StaffDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine clef based on note octave
  const clef = noteId ? getClefForNote(noteId) : 'treble';

  const frame = useMemo(() => computeStaffFrame(noteSet ?? []), [noteSet]);

  // Use the VexFlow hook to render the staff
  useVexFlow({ noteId, clef, containerRef, frame });

  return (
    // No card here: the notation prints straight onto the page's paper
    // ground; a bordered panel would frame mostly empty space.
    <div className="flex items-center justify-center">
      <div
        ref={containerRef}
        style={{
          height: 'min(660px, 40vh)',
          aspectRatio: `${frame.width} / ${frame.height}`,
          maxWidth: '100%',
        }}
        aria-label={noteId ? `Musical staff showing note ${noteId}` : 'Empty musical staff'}
      />
    </div>
  );
}
