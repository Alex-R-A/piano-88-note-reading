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
    renderer.resize(44, 80);
    const context = renderer.getContext();
    context.scale(0.5, 0.5);

    const clef = getClefForNote(noteId);
    // Position stave centered, minimal width for single note
    const stave = new Stave(0, 50, 70);
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
      style={{ width: 44, height: 80 }}
      aria-label={`Note ${noteId} on staff`}
    />
  );
}
