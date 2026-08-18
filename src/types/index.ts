// types/index.ts

// Note letter names
export type NoteLetter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

// Accidental types
export type Accidental = 'sharp' | 'flat' | 'natural';

// Unique note identifier: "C#4", "Bb3", "G5"
export type NoteId = string;

// Pitch class without octave: "C#", "Bb", "G"
export type PitchClass = string;

// Structured note representation
export interface Note {
  letter: NoteLetter;
  accidental: Accidental;
  octave: number;
}

// Clef types
export type Clef = 'treble' | 'bass';

// Lesson statistics per note
export interface NoteStats {
  shown: number;
  correct: number;
}

// Settings state
// Feedback state type
export type FeedbackState = 'none' | 'correct' | 'incorrect' | 'showAnswer';

// Lesson algorithm state
// Screen routing
export type Screen = 'main' | 'lesson' | 'analytics';

