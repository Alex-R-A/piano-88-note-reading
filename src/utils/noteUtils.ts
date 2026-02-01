// utils/noteUtils.ts

import type { Note, NoteLetter, NoteId, PitchClass, Clef, WhiteKeyProfile, Accidental } from '@/types';

// Enharmonic equivalents mapping: pitch class -> normalized key position (0-11)
const PITCH_CLASS_TO_POSITION: Record<string, number> = {
  'C': 0, 'B#': 0,
  'C#': 1, 'Db': 1,
  'D': 2,
  'D#': 3, 'Eb': 3,
  'E': 4, 'Fb': 4,
  'F': 5, 'E#': 5,
  'F#': 6, 'Gb': 6,
  'G': 7,
  'G#': 8, 'Ab': 8,
  'A': 9,
  'A#': 10, 'Bb': 10,
  'B': 11, 'Cb': 11,
};

// Black key positions (0-indexed semitones)
const BLACK_KEY_POSITIONS = new Set([1, 3, 6, 8, 10]);

/**
 * Parse NoteId string into structured Note object
 * "C#4" -> { letter: 'C', accidental: 'sharp', octave: 4 }
 * "Bb3" -> { letter: 'B', accidental: 'flat', octave: 3 }
 * "G5" -> { letter: 'G', accidental: 'natural', octave: 5 }
 */
export function parseNote(noteId: NoteId): Note {
  const match = noteId.match(/^([A-G])(#|b)?(\d)$/);
  if (!match) {
    throw new Error(`Invalid NoteId: ${noteId}`);
  }

  const letter = match[1] as NoteLetter;
  const accidentalSymbol = match[2];
  const octave = parseInt(match[3], 10);

  let accidental: Accidental;
  if (accidentalSymbol === '#') {
    accidental = 'sharp';
  } else if (accidentalSymbol === 'b') {
    accidental = 'flat';
  } else {
    accidental = 'natural';
  }

  return { letter, accidental, octave };
}

/**
 * Convert Note object to NoteId string
 * { letter: 'C', accidental: 'sharp', octave: 4 } -> "C#4"
 */
export function formatNote(note: Note): NoteId {
  let accidentalSymbol = '';
  if (note.accidental === 'sharp') {
    accidentalSymbol = '#';
  } else if (note.accidental === 'flat') {
    accidentalSymbol = 'b';
  }
  return `${note.letter}${accidentalSymbol}${note.octave}`;
}

/**
 * Extract pitch class from NoteId (remove octave)
 * "C#4" -> "C#"
 * "Bb3" -> "Bb"
 * "G5" -> "G"
 */
export function extractPitchClass(noteId: NoteId): PitchClass {
  const note = parseNote(noteId);
  let accidentalSymbol = '';
  if (note.accidental === 'sharp') {
    accidentalSymbol = '#';
  } else if (note.accidental === 'flat') {
    accidentalSymbol = 'b';
  }
  return `${note.letter}${accidentalSymbol}`;
}

/**
 * Check if two pitch classes are enharmonic equivalents
 * ("C#", "Db") -> true
 * ("C#", "C") -> false
 */
export function areEnharmonic(a: PitchClass, b: PitchClass): boolean {
  const posA = PITCH_CLASS_TO_POSITION[a];
  const posB = PITCH_CLASS_TO_POSITION[b];

  if (posA === undefined || posB === undefined) {
    throw new Error(`Invalid pitch class: ${posA === undefined ? a : b}`);
  }

  return posA === posB;
}

/**
 * Get the physical key position (0-11) for a pitch class
 * "C" -> 0, "C#"/"Db" -> 1, "D" -> 2, etc.
 */
export function getKeyPosition(pitchClass: PitchClass): number {
  const position = PITCH_CLASS_TO_POSITION[pitchClass];
  if (position === undefined) {
    throw new Error(`Invalid pitch class: ${pitchClass}`);
  }
  return position;
}

/**
 * Determine if a pitch class is a black key
 */
export function isBlackKey(pitchClass: PitchClass): boolean {
  const position = getKeyPosition(pitchClass);
  return BLACK_KEY_POSITIONS.has(position);
}

/**
 * Get the appropriate clef for a note
 * Octave >= 4 -> treble, else bass
 */
export function getClefForNote(noteId: NoteId): Clef {
  const note = parseNote(noteId);
  return note.octave >= 4 ? 'treble' : 'bass';
}

/**
 * Generate all notes for given octaves and settings
 */
export function generateNoteSet(
  selectedOctaves: number[],
  includeSharpsFlats: boolean
): NoteId[] {
  const notes: NoteId[] = [];

  for (const octave of selectedOctaves) {
    if (octave === 0) {
      // Octave 0 only has A, Bb, B
      notes.push('A0', 'B0');
      if (includeSharpsFlats) {
        notes.push('Bb0'); // Only flat between A and B
      }
    } else if (octave === 8) {
      // Octave 8 only has C
      notes.push('C8');
    } else {
      // Full octave - add natural notes
      const naturals: NoteLetter[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
      for (const natural of naturals) {
        notes.push(`${natural}${octave}`);
      }

      if (includeSharpsFlats) {
        // Add BOTH sharp and flat spellings for each black key
        notes.push(`C#${octave}`, `Db${octave}`); // Same key
        notes.push(`D#${octave}`, `Eb${octave}`); // Same key
        notes.push(`F#${octave}`, `Gb${octave}`); // Same key
        notes.push(`G#${octave}`, `Ab${octave}`); // Same key
        notes.push(`A#${octave}`, `Bb${octave}`); // Same key
      }
    }
  }

  return notes;
}

/**
 * Get the white key profile type for a given letter
 * C, F -> 'type1' (notch on right only)
 * D, G, A -> 'type2' (notches on both sides)
 * E, B -> 'type3' (notch on left only)
 */
export function getWhiteKeyProfile(letter: NoteLetter): WhiteKeyProfile {
  switch (letter) {
    case 'C':
    case 'F':
      return 'type1';
    case 'D':
    case 'G':
    case 'A':
      return 'type2';
    case 'E':
    case 'B':
      return 'type3';
    default:
      // TypeScript exhaustiveness check
      const _exhaustiveCheck: never = letter;
      throw new Error(`Unknown letter: ${_exhaustiveCheck}`);
  }
}
