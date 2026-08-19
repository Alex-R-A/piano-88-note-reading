// stores/answerCorrectness.test.ts
// Exhaustive truth table for answer validation: every note the app can
// display (all octaves, both accidental spellings) against every pitch class
// the user can submit (7 white keys, 5 sharp-spelled black keys - the same
// twelve values the keyboard clicks and the microphone emit).
//
// Correctness is judged by an INDEPENDENT ground truth written here from
// music-theory first principles (letter semitones plus accidental offset),
// deliberately not reusing the app's enharmonic table, so a wrong entry in
// that table cannot silently agree with the test.
import { describe, it, expect } from 'vitest';
import { useLessonStore } from './lessonStore';
import { generateNoteSet } from '@/utils/noteUtils';
import type { NoteId, PitchClass } from '@/types';

// Ground truth: semitone offsets of the natural letters within an octave.
// C=0 D=2 E=4 F=5 G=7 A=9 B=11 is the definition of the major-scale layout
// on a keyboard; a sharp raises by one semitone, a flat lowers by one.
const LETTER_SEMITONE: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

function semitoneOf(pitchClass: string): number {
  const letter = pitchClass[0];
  const accidental = pitchClass.slice(1);
  const offset = accidental === '#' ? 1 : accidental === 'b' ? -1 : 0;
  return (LETTER_SEMITONE[letter] + offset + 12) % 12;
}

/** The twelve physical keys a user can press (keyboard) or sound (mic). */
const CLICKABLE: PitchClass[] = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
];

function askAndAnswer(displayed: NoteId, clicked: PitchClass): boolean {
  useLessonStore.setState({
    isActive: true,
    fullNoteSet: [displayed],
    remainingNotes: new Set([displayed]),
    errorWeights: new Map(),
    recentBuffer: [],
    currentNote: displayed,
    noteSelectionId: 1,
    stats: new Map(),
    feedbackState: 'none',
  });
  return useLessonStore.getState().processAnswer(clicked);
}

describe('answer correctness truth table', () => {
  // All octaves, accidentals on: the complete universe of displayable notes.
  const allNotes = generateNoteSet([0, 1, 2, 3, 4, 5, 6, 7, 8], true);

  it('covers the full displayable universe', () => {
    // 0: A0,B0,A#0,Bb0 = 4; 1-7: 7 naturals + 10 spellings = 17 each; 8: C8.
    expect(allNotes).toHaveLength(4 + 7 * 17 + 1);
  });

  it('judges every displayed note x every playable key correctly', () => {
    for (const displayed of allNotes) {
      const displayedClass = displayed.replace(/\d+$/, '');
      for (const clicked of CLICKABLE) {
        const expected = semitoneOf(displayedClass) === semitoneOf(clicked);
        const actual = askAndAnswer(displayed, clicked);
        expect(
          actual,
          `displayed ${displayed}, answered ${clicked}: should be ${
            expected ? 'correct' : 'wrong'
          }`
        ).toBe(expected);
      }
    }
  });

  it('records stats and feedback consistently with the verdict', () => {
    // One correct and one wrong case, checked end to end through the store.
    expect(askAndAnswer('Db4', 'C#')).toBe(true);
    let s = useLessonStore.getState();
    expect(s.stats.get('Db4')).toEqual({ shown: 1, correct: 1 });
    expect(s.feedbackState).toBe('correct');

    expect(askAndAnswer('Db4', 'D')).toBe(false);
    s = useLessonStore.getState();
    expect(s.stats.get('Db4')).toEqual({ shown: 1, correct: 0 });
    expect(s.feedbackState).toBe('incorrect');
  });
});
