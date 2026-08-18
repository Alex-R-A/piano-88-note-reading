// components/LessonScreen/StaffDisplay.tsx
import { useRef } from 'react';
import { useVexFlow, STAFF_ASPECT_RATIO } from '@/hooks';
import { getClefForNote } from '@/utils/noteUtils';
import type { NoteId } from '@/types';

interface StaffDisplayProps {
  noteId: NoteId | null;
}

/**
 * Renders a musical staff with the given note using VexFlow.
 * Clef selection: octave >= 4 -> treble, else bass.
 * Clef at 50% opacity, note at 100% opacity.
 * Container sized at 400x150 per spec.
 */
export function StaffDisplay({ noteId }: StaffDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine clef based on note octave
  const clef = noteId ? getClefForNote(noteId) : 'treble';

  // Use the VexFlow hook to render the staff
  useVexFlow({ noteId, clef, containerRef });

  return (
    // No card here: the render surface is 500x660 but the notation only fills
    // part of it, so a bordered panel would frame mostly empty space. Letting
    // the staff print straight onto the page's paper ground reads better.
    <div className="flex items-center justify-center">
      <div
        ref={containerRef}
        style={{
          height: 'min(660px, 40vh)',
          aspectRatio: STAFF_ASPECT_RATIO,
          maxWidth: '100%',
        }}
        aria-label={noteId ? `Musical staff showing note ${noteId}` : 'Empty musical staff'}
      />
    </div>
  );
}
