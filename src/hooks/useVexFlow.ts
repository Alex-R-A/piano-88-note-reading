// hooks/useVexFlow.ts
import { useEffect, useRef } from 'react';
import { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } from 'vexflow';
import { parseNote } from '@/utils/noteUtils';
import type { NoteId, Clef } from '@/types';

interface UseVexFlowOptions {
  noteId: NoteId | null;
  clef: Clef;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * VexFlow integration hook per spec lines 932-989.
 * Renders a musical staff with clef at 50% opacity and note at 100% opacity.
 * Handles accidentals and leger lines automatically.
 */
export function useVexFlow({ noteId, clef, containerRef }: UseVexFlowOptions) {
  const rendererRef = useRef<InstanceType<typeof Renderer> | null>(null);

  useEffect(() => {
    if (!containerRef.current || !noteId) return;

    // Clear previous render
    containerRef.current.innerHTML = '';

    // Create renderer targeting the container
    const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
    rendererRef.current = renderer;

    // Size the renderer (1200x450 - 3x size)
    renderer.resize(1200, 450);
    const context = renderer.getContext();
    context.scale(3, 3); // Scale everything 3x

    // Create stave with clef - centered vertically to allow room for leger lines
    const stave = new Stave(10, 25, 380);
    stave.addClef(clef);
    stave.setContext(context).draw();

    // Apply 50% opacity to clef via CSS after render
    const clefElement = containerRef.current.querySelector('.vf-clef');
    if (clefElement) {
      (clefElement as SVGElement).style.opacity = '0.5';
    }

    // Parse note and create StaveNote
    const note = parseNote(noteId);
    // VexFlow uses format: letter/octave (e.g., "c/4", "f#/5")
    const vexKey = `${note.letter.toLowerCase()}/${note.octave}`;

    const staveNote = new StaveNote({
      keys: [vexKey],
      duration: 'w', // whole note
      clef: clef,
    });

    // Add accidental if needed
    if (note.accidental === 'sharp') {
      staveNote.addModifier(new Accidental('#'));
    } else if (note.accidental === 'flat') {
      staveNote.addModifier(new Accidental('b'));
    }

    // Create voice and format - center the note by using larger width
    const voice = new Voice({ numBeats: 4, beatValue: 4 });
    voice.addTickable(staveNote);

    // Format with padding to center the note
    new Formatter().joinVoices([voice]).format([voice], 100);

    // Draw the voice with x offset to center horizontally
    voice.draw(context, stave, 150);

    // Cleanup function
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [noteId, clef, containerRef]);
}
