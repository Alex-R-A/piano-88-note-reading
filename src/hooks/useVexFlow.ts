// hooks/useVexFlow.ts
import { useEffect, useRef } from 'react';
import { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } from 'vexflow';
import { parseNote, getClefForNote } from '@/utils/noteUtils';
import type { NoteId, Clef } from '@/types';

// The staff-plus-clef block always occupies the same drawing coordinates;
// only ledger-line notes extend past it. Measured from real renders:
// the block spans y 29.7..210.5 (either clef) and x 10..161; C8's ledger
// stack reaches up to y=-70.5 (treble) and A0's down to y=285.6 (bass).
// The two anchors below reproduce those extremes at 5 units per diatonic
// step, which is how notes are spaced on a staff.
const FRAME_PAD = 10;
const BLOCK_TOP = 29.7;
const BLOCK_BOTTOM = 210.5;
const BLOCK_LEFT = 10;
const BLOCK_RIGHT = 161;
const UNITS_PER_STEP = 5;
const TREBLE_TOP_ANCHOR = { d: 56, top: -70.5 }; // C8
const BASS_BOTTOM_ANCHOR = { d: 5, bottom: 285.6 }; // A0

const LETTER_STEP: Record<string, number> = {
  C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6,
};

export interface StaffFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * A fixed drawing window for a whole lesson, sized so that every note in the
 * set fits. Framing per lesson instead of per note keeps the five staff
 * lines anchored on screen; the notes move around them, not the staff
 * around the notes. Falls back to the staff-plus-clef block for an empty
 * set. Accidentals do not affect it: sharp and flat sit on the letter's
 * line.
 */
export function computeStaffFrame(noteSet: NoteId[]): StaffFrame {
  let top = BLOCK_TOP;
  let bottom = BLOCK_BOTTOM;
  for (const noteId of noteSet) {
    const note = parseNote(noteId);
    const d = LETTER_STEP[note.letter] + note.octave * 7;
    if (getClefForNote(noteId) === 'treble') {
      top = Math.min(top, TREBLE_TOP_ANCHOR.top + (TREBLE_TOP_ANCHOR.d - d) * UNITS_PER_STEP);
    } else {
      bottom = Math.max(bottom, BASS_BOTTOM_ANCHOR.bottom - (d - BASS_BOTTOM_ANCHOR.d) * UNITS_PER_STEP);
    }
  }
  return {
    x: BLOCK_LEFT - FRAME_PAD,
    y: top - FRAME_PAD,
    width: BLOCK_RIGHT - BLOCK_LEFT + FRAME_PAD * 2,
    height: bottom - top + FRAME_PAD * 2,
  };
}

interface UseVexFlowOptions {
  noteId: NoteId | null;
  clef: Clef;
  containerRef: React.RefObject<HTMLDivElement | null>;
  frame: StaffFrame;
}

/**
 * VexFlow integration hook per spec lines 932-989.
 * Renders a musical staff with clef at 50% opacity and note at 100% opacity.
 * Handles accidentals and leger lines automatically.
 */
export function useVexFlow({ noteId, clef, containerRef, frame }: UseVexFlowOptions) {
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

    // The stave and clef redraw identically on every note, so they read as
    // constant; only the note is new, and it fades in quickly rather than
    // appearing behind a masking overlay (which showed as a pale square over
    // the answer-feedback wash).
    const noteGroup = containerRef.current.querySelector('.vf-stavenote');
    if (noteGroup) {
      (noteGroup as SVGElement).style.animation = 'note-fade-in 320ms ease-out both';
    }

    // Frame the drawing with the lesson-wide fixed window. Refitting the
    // viewBox per note made the five staff lines jump up and down as
    // ledger-line notes stretched the drawn extent; with one frame per
    // lesson the staff is anchored and only the notes move.
    //
    // Making the element fluid at the same time lets the staff scale with
    // its container instead of pinning the lesson screen to 660px of height.
    const svg = containerRef.current.querySelector('svg');
    if (svg) {
      svg.setAttribute('viewBox', `${frame.x} ${frame.y} ${frame.width} ${frame.height}`);
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
  }, [noteId, clef, containerRef, frame]);
}
