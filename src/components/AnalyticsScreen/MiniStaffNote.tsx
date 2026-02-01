// components/AnalyticsScreen/MiniStaffNote.tsx
import { useEffect, useRef } from 'react';
import { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } from 'vexflow';
import { parseNote, getClefForNote } from '@/utils/noteUtils';
import type { NoteId } from '@/types';

interface MiniStaffNoteProps {
  noteId: NoteId;
}

/**
 * Renders a small musical staff with clef and note for the analytics table.
 */
export function MiniStaffNote({ noteId }: MiniStaffNoteProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = '';

    const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
    renderer.resize(50, 60);
    const context = renderer.getContext();
    context.scale(0.5, 0.5);

    const clef = getClefForNote(noteId);
    // Stave at y=0, container uses CSS to center
    const stave = new Stave(0, 0, 80);
    stave.addClef(clef);
    stave.setContext(context).draw();

    // Apply 50% opacity to clef
    const clefElement = containerRef.current.querySelector('.vf-clef');
    if (clefElement) {
      (clefElement as SVGElement).style.opacity = '0.5';
    }

    const note = parseNote(noteId);
    const vexKey = `${note.letter.toLowerCase()}/${note.octave}`;

    const staveNote = new StaveNote({
      keys: [vexKey],
      duration: 'w',
      clef: clef,
    });

    if (note.accidental === 'sharp') {
      staveNote.addModifier(new Accidental('#'));
    } else if (note.accidental === 'flat') {
      staveNote.addModifier(new Accidental('b'));
    }

    const voice = new Voice({ numBeats: 4, beatValue: 4 });
    voice.addTickable(staveNote);
    new Formatter().joinVoices([voice]).format([voice], 60);
    voice.draw(context, stave, 100);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [noteId]);

  return (
    <div
      className="flex items-center justify-center"
      style={{ width: 50, height: 60 }}
      aria-label={`Note ${noteId} on staff`}
    >
      <div ref={containerRef} />
    </div>
  );
}
