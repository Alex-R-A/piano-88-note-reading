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

    // Size the renderer (400x150 per spec)
    renderer.resize(400, 150);
    const context = renderer.getContext();

    // Create stave with clef
    // Positioning: x=10, y=20, width=380 leaves margins
    const stave = new Stave(10, 20, 380);
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

    // Create voice and format
    // 4 beats / beat value 4 = one measure of 4/4 for a whole note
    const voice = new Voice({ numBeats: 4, beatValue: 4 });
    voice.addTickable(staveNote);

    // Format the voice to fit within the stave width (minus padding)
    new Formatter().joinVoices([voice]).format([voice], 350);

    // Draw the voice
    voice.draw(context, stave);

    // Cleanup function
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [noteId, clef, containerRef]);
}
