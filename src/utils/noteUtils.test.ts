import { describe, it, expect } from 'vitest';
import {
  parseNote,
  formatNote,
  extractPitchClass,
  areEnharmonic,
  getKeyPosition,
  isBlackKey,
  getClefForNote,
  generateNoteSet,
  getWhiteKeyProfile,
} from './noteUtils';

describe('parseNote', () => {
  it('parses natural notes correctly', () => {
    expect(parseNote('C4')).toEqual({ letter: 'C', accidental: 'natural', octave: 4 });
    expect(parseNote('G5')).toEqual({ letter: 'G', accidental: 'natural', octave: 5 });
    expect(parseNote('A0')).toEqual({ letter: 'A', accidental: 'natural', octave: 0 });
  });

  it('parses sharp notes correctly', () => {
    expect(parseNote('C#4')).toEqual({ letter: 'C', accidental: 'sharp', octave: 4 });
    expect(parseNote('F#3')).toEqual({ letter: 'F', accidental: 'sharp', octave: 3 });
    expect(parseNote('G#7')).toEqual({ letter: 'G', accidental: 'sharp', octave: 7 });
  });

  it('parses flat notes correctly', () => {
    expect(parseNote('Bb3')).toEqual({ letter: 'B', accidental: 'flat', octave: 3 });
    expect(parseNote('Eb4')).toEqual({ letter: 'E', accidental: 'flat', octave: 4 });
    expect(parseNote('Db2')).toEqual({ letter: 'D', accidental: 'flat', octave: 2 });
  });

  it('throws on invalid note format', () => {
    expect(() => parseNote('H4')).toThrow('Invalid NoteId');
    expect(() => parseNote('C')).toThrow('Invalid NoteId');
    expect(() => parseNote('4')).toThrow('Invalid NoteId');
    expect(() => parseNote('')).toThrow('Invalid NoteId');
    expect(() => parseNote('C##4')).toThrow('Invalid NoteId');
  });
});

describe('formatNote', () => {
  it('formats natural notes correctly', () => {
    expect(formatNote({ letter: 'C', accidental: 'natural', octave: 4 })).toBe('C4');
    expect(formatNote({ letter: 'G', accidental: 'natural', octave: 5 })).toBe('G5');
  });

  it('formats sharp notes correctly', () => {
    expect(formatNote({ letter: 'C', accidental: 'sharp', octave: 4 })).toBe('C#4');
    expect(formatNote({ letter: 'F', accidental: 'sharp', octave: 3 })).toBe('F#3');
  });

  it('formats flat notes correctly', () => {
    expect(formatNote({ letter: 'B', accidental: 'flat', octave: 3 })).toBe('Bb3');
    expect(formatNote({ letter: 'E', accidental: 'flat', octave: 4 })).toBe('Eb4');
  });

  it('is inverse of parseNote', () => {
    const noteIds = ['C4', 'C#4', 'Db4', 'G5', 'Bb3', 'A0', 'C8'];
    for (const noteId of noteIds) {
      expect(formatNote(parseNote(noteId))).toBe(noteId);
    }
  });
});

describe('extractPitchClass', () => {
  it('extracts pitch class from natural notes', () => {
    expect(extractPitchClass('C4')).toBe('C');
    expect(extractPitchClass('G5')).toBe('G');
    expect(extractPitchClass('A0')).toBe('A');
  });

  it('extracts pitch class from sharp notes', () => {
    expect(extractPitchClass('C#4')).toBe('C#');
    expect(extractPitchClass('F#3')).toBe('F#');
  });

  it('extracts pitch class from flat notes', () => {
    expect(extractPitchClass('Bb3')).toBe('Bb');
    expect(extractPitchClass('Eb4')).toBe('Eb');
  });

  it('ignores octave number', () => {
    expect(extractPitchClass('C#4')).toBe(extractPitchClass('C#7'));
    expect(extractPitchClass('Bb0')).toBe(extractPitchClass('Bb5'));
  });
});

describe('areEnharmonic', () => {
  it('returns true for enharmonic equivalents', () => {
    expect(areEnharmonic('C#', 'Db')).toBe(true);
    expect(areEnharmonic('D#', 'Eb')).toBe(true);
    expect(areEnharmonic('F#', 'Gb')).toBe(true);
    expect(areEnharmonic('G#', 'Ab')).toBe(true);
    expect(areEnharmonic('A#', 'Bb')).toBe(true);
  });

  it('returns true for same pitch class', () => {
    expect(areEnharmonic('C', 'C')).toBe(true);
    expect(areEnharmonic('C#', 'C#')).toBe(true);
    expect(areEnharmonic('Db', 'Db')).toBe(true);
  });

  it('returns false for non-enharmonic pitch classes', () => {
    expect(areEnharmonic('C#', 'C')).toBe(false);
    expect(areEnharmonic('C', 'D')).toBe(false);
    expect(areEnharmonic('F#', 'F')).toBe(false);
    expect(areEnharmonic('Bb', 'B')).toBe(false);
  });

  it('handles edge case enharmonics (B#/C and E#/F)', () => {
    expect(areEnharmonic('B#', 'C')).toBe(true);
    expect(areEnharmonic('E#', 'F')).toBe(true);
    expect(areEnharmonic('Fb', 'E')).toBe(true);
    expect(areEnharmonic('Cb', 'B')).toBe(true);
  });

  it('throws on invalid pitch class', () => {
    expect(() => areEnharmonic('H', 'C')).toThrow('Invalid pitch class');
    expect(() => areEnharmonic('C', 'H')).toThrow('Invalid pitch class');
  });
});

describe('getKeyPosition', () => {
  it('returns correct positions for natural notes', () => {
    expect(getKeyPosition('C')).toBe(0);
    expect(getKeyPosition('D')).toBe(2);
    expect(getKeyPosition('E')).toBe(4);
    expect(getKeyPosition('F')).toBe(5);
    expect(getKeyPosition('G')).toBe(7);
    expect(getKeyPosition('A')).toBe(9);
    expect(getKeyPosition('B')).toBe(11);
  });

  it('returns correct positions for sharps', () => {
    expect(getKeyPosition('C#')).toBe(1);
    expect(getKeyPosition('D#')).toBe(3);
    expect(getKeyPosition('F#')).toBe(6);
    expect(getKeyPosition('G#')).toBe(8);
    expect(getKeyPosition('A#')).toBe(10);
  });

  it('returns correct positions for flats', () => {
    expect(getKeyPosition('Db')).toBe(1);
    expect(getKeyPosition('Eb')).toBe(3);
    expect(getKeyPosition('Gb')).toBe(6);
    expect(getKeyPosition('Ab')).toBe(8);
    expect(getKeyPosition('Bb')).toBe(10);
  });

  it('returns same position for enharmonic equivalents', () => {
    expect(getKeyPosition('C#')).toBe(getKeyPosition('Db'));
    expect(getKeyPosition('D#')).toBe(getKeyPosition('Eb'));
    expect(getKeyPosition('F#')).toBe(getKeyPosition('Gb'));
    expect(getKeyPosition('G#')).toBe(getKeyPosition('Ab'));
    expect(getKeyPosition('A#')).toBe(getKeyPosition('Bb'));
  });

  it('throws on invalid pitch class', () => {
    expect(() => getKeyPosition('H')).toThrow('Invalid pitch class');
    expect(() => getKeyPosition('C##')).toThrow('Invalid pitch class');
  });
});

describe('isBlackKey', () => {
  it('returns false for natural notes (white keys)', () => {
    expect(isBlackKey('C')).toBe(false);
    expect(isBlackKey('D')).toBe(false);
    expect(isBlackKey('E')).toBe(false);
    expect(isBlackKey('F')).toBe(false);
    expect(isBlackKey('G')).toBe(false);
    expect(isBlackKey('A')).toBe(false);
    expect(isBlackKey('B')).toBe(false);
  });

  it('returns true for sharps (black keys)', () => {
    expect(isBlackKey('C#')).toBe(true);
    expect(isBlackKey('D#')).toBe(true);
    expect(isBlackKey('F#')).toBe(true);
    expect(isBlackKey('G#')).toBe(true);
    expect(isBlackKey('A#')).toBe(true);
  });

  it('returns true for flats (black keys)', () => {
    expect(isBlackKey('Db')).toBe(true);
    expect(isBlackKey('Eb')).toBe(true);
    expect(isBlackKey('Gb')).toBe(true);
    expect(isBlackKey('Ab')).toBe(true);
    expect(isBlackKey('Bb')).toBe(true);
  });

  it('handles edge cases (E#/Fb/B#/Cb are white keys)', () => {
    // E# = F (white key)
    expect(isBlackKey('E#')).toBe(false);
    // Fb = E (white key)
    expect(isBlackKey('Fb')).toBe(false);
    // B# = C (white key)
    expect(isBlackKey('B#')).toBe(false);
    // Cb = B (white key)
    expect(isBlackKey('Cb')).toBe(false);
  });
});

describe('getClefForNote', () => {
  it('returns treble for octave 4 and above', () => {
    expect(getClefForNote('C4')).toBe('treble');
    expect(getClefForNote('C#4')).toBe('treble');
    expect(getClefForNote('G5')).toBe('treble');
    expect(getClefForNote('C8')).toBe('treble');
    expect(getClefForNote('B7')).toBe('treble');
  });

  it('returns bass for octave 3 and below', () => {
    expect(getClefForNote('B3')).toBe('bass');
    expect(getClefForNote('C3')).toBe('bass');
    expect(getClefForNote('Bb3')).toBe('bass');
    expect(getClefForNote('A0')).toBe('bass');
    expect(getClefForNote('C1')).toBe('bass');
  });
});

describe('generateNoteSet', () => {
  describe('without sharps/flats', () => {
    it('generates 7 natural notes for a full octave', () => {
      const notes = generateNoteSet([4], false);
      expect(notes).toHaveLength(7);
      expect(notes).toEqual(['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4']);
    });

    it('generates correct notes for octave 0 (partial)', () => {
      const notes = generateNoteSet([0], false);
      expect(notes).toHaveLength(2);
      expect(notes).toEqual(['A0', 'B0']);
    });

    it('generates correct notes for octave 8 (partial)', () => {
      const notes = generateNoteSet([8], false);
      expect(notes).toHaveLength(1);
      expect(notes).toEqual(['C8']);
    });

    it('generates notes for multiple octaves', () => {
      const notes = generateNoteSet([3, 4, 5], false);
      expect(notes).toHaveLength(21); // 3 * 7 = 21
      expect(notes).toContain('C3');
      expect(notes).toContain('C4');
      expect(notes).toContain('C5');
    });

    it('returns empty array for empty octave selection', () => {
      const notes = generateNoteSet([], false);
      expect(notes).toHaveLength(0);
    });
  });

  describe('with sharps/flats', () => {
    it('generates 17 notes for a full octave (7 natural + 10 accidentals)', () => {
      const notes = generateNoteSet([4], true);
      expect(notes).toHaveLength(17);
      // Naturals
      expect(notes).toContain('C4');
      expect(notes).toContain('D4');
      expect(notes).toContain('E4');
      expect(notes).toContain('F4');
      expect(notes).toContain('G4');
      expect(notes).toContain('A4');
      expect(notes).toContain('B4');
      // Sharps
      expect(notes).toContain('C#4');
      expect(notes).toContain('D#4');
      expect(notes).toContain('F#4');
      expect(notes).toContain('G#4');
      expect(notes).toContain('A#4');
      // Flats
      expect(notes).toContain('Db4');
      expect(notes).toContain('Eb4');
      expect(notes).toContain('Gb4');
      expect(notes).toContain('Ab4');
      expect(notes).toContain('Bb4');
    });

    it('generates correct notes for octave 0 with accidentals', () => {
      const notes = generateNoteSet([0], true);
      expect(notes).toHaveLength(3);
      expect(notes).toContain('A0');
      expect(notes).toContain('Bb0');
      expect(notes).toContain('B0');
    });

    it('generates correct notes for octave 8 (no accidentals, just C8)', () => {
      const notes = generateNoteSet([8], true);
      expect(notes).toHaveLength(1);
      expect(notes).toEqual(['C8']);
    });

    it('generates notes for multiple octaves with accidentals', () => {
      const notes = generateNoteSet([3, 4, 5], true);
      expect(notes).toHaveLength(51); // 3 * 17 = 51
    });
  });
});

describe('getWhiteKeyProfile', () => {
  it('returns type1 for C and F (notch on right)', () => {
    expect(getWhiteKeyProfile('C')).toBe('type1');
    expect(getWhiteKeyProfile('F')).toBe('type1');
  });

  it('returns type2 for D, G, A (notches on both sides)', () => {
    expect(getWhiteKeyProfile('D')).toBe('type2');
    expect(getWhiteKeyProfile('G')).toBe('type2');
    expect(getWhiteKeyProfile('A')).toBe('type2');
  });

  it('returns type3 for E and B (notch on left)', () => {
    expect(getWhiteKeyProfile('E')).toBe('type3');
    expect(getWhiteKeyProfile('B')).toBe('type3');
  });
});
