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
    renderer.resize(120, 100);
    const context = renderer.getContext();
    context.scale(0.25, 0.25);

    const clef = getClefForNote(noteId);
    // Position stave centered (100/0.25 = 400 height, stave at ~150 centers the staff lines)
    const stave = new Stave(0, 150, 450);
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
      ref={containerRef}
      style={{ width: 120, height: 100 }}
      aria-label={`Note ${noteId} on staff`}
    />
  );
}
