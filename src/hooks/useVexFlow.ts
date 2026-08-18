// hooks/useVexFlow.ts
import { useEffect, useRef } from 'react';
import { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } from 'vexflow';
import { parseNote } from '@/utils/noteUtils';
import type { NoteId, Clef } from '@/types';

// The renderer is 500x660 CSS px at a 3x context scale, so VexFlow's own
// coordinate window is this many user units. Notes are framed against it.
const DEFAULT_VIEW_WIDTH = 500 / 3;
const DEFAULT_VIEW_HEIGHT = 660 / 3;

/** Aspect ratio of the default view, for sizing the container. */
export const STAFF_ASPECT_RATIO = DEFAULT_VIEW_WIDTH / DEFAULT_VIEW_HEIGHT;

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

    // Size the renderer - tall enough for extreme leger lines
    renderer.resize(500, 660);
    const context = renderer.getContext();
    context.scale(3, 3); // Scale everything 3x


    // Create stave with clef - short width, balanced position for high and low leger lines
    const stave = new Stave(10, 60, 150);
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
    const voice = new Voice({ numBeats: 4, beatValue: 4 });
    voice.addTickable(staveNote);

    new Formatter().joinVoices([voice]).format([voice], 30);

    // Shift via TickContext so accidental moves with the notehead
    // (staveNote.setXShift only moves the notehead, leaving accidental anchored)
    const tc = staveNote.getTickContext();
    tc.setX(tc.getX() + 25);

    // Draw the voice
    voice.draw(context, stave);

    // Frame the drawing.
    //
    // VexFlow sizes the SVG to a fixed window (166.67 x 220 user units after
    // the 3x scale). Notes needing many leger lines draw outside it and are
    // clipped by the SVG viewport: C8's notehead sits ~70 units above the top
    // edge and is cut in half. Fit the viewBox to what was actually drawn, but
    // never below the default window, so ordinary notes keep exactly the size
    // and position they had and only the extremes zoom out to fit.
    //
    // Making the element fluid at the same time lets the staff scale with its
    // container instead of pinning the lesson screen to 660px of height.
    const svg = containerRef.current.querySelector('svg');
    if (svg) {
      const bounds = svg.getBBox();
      const pad = 6;
      let x = bounds.x - pad;
      let y = bounds.y - pad;
      let width = bounds.width + pad * 2;
      let height = bounds.height + pad * 2;

      if (width < DEFAULT_VIEW_WIDTH) {
        x -= (DEFAULT_VIEW_WIDTH - width) / 2;
        width = DEFAULT_VIEW_WIDTH;
      }
      if (height < DEFAULT_VIEW_HEIGHT) {
        y -= (DEFAULT_VIEW_HEIGHT - height) / 2;
        height = DEFAULT_VIEW_HEIGHT;
      }

      svg.setAttribute('viewBox', `${x} ${y} ${width} ${height}`);
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');
      // VexFlow also writes an inline width/height, which wins over the
      // attributes and would keep the element pinned at 500x660.
      svg.style.width = '100%';
      svg.style.height = '100%';
      svg.style.display = 'block';
    }

    // Cleanup function
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [noteId, clef, containerRef]);
}
