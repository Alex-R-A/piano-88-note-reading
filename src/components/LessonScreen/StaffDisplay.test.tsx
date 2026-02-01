// components/LessonScreen/StaffDisplay.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StaffDisplay } from './StaffDisplay';
import { getClefForNote } from '@/utils/noteUtils';

// Mock VexFlow since it manipulates DOM directly
vi.mock('vexflow', () => {
  const mockContext = {
    setFont: vi.fn(),
    scale: vi.fn(),
  };

  const MockStave = vi.fn().mockImplementation(() => ({
    addClef: vi.fn().mockReturnThis(),
    setContext: vi.fn().mockReturnThis(),
    draw: vi.fn().mockReturnThis(),
  }));

  const MockStaveNote = vi.fn().mockImplementation(() => ({
    addModifier: vi.fn().mockReturnThis(),
  }));

  const MockVoice = vi.fn().mockImplementation(() => ({
    addTickable: vi.fn().mockReturnThis(),
    draw: vi.fn().mockReturnThis(),
  }));

  const MockFormatter = vi.fn().mockImplementation(() => ({
    joinVoices: vi.fn().mockReturnThis(),
    format: vi.fn().mockReturnThis(),
  }));

  const MockAccidental = vi.fn().mockImplementation(() => ({}));

  const MockRenderer = vi.fn().mockImplementation(() => ({
    resize: vi.fn(),
    getContext: vi.fn().mockReturnValue(mockContext),
  }));
  MockRenderer.Backends = { SVG: 2, CANVAS: 1 };

  return {
    Renderer: MockRenderer,
    Stave: MockStave,
    StaveNote: MockStaveNote,
    Voice: MockVoice,
    Formatter: MockFormatter,
    Accidental: MockAccidental,
  };
});

describe('StaffDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing when noteId is null', () => {
    render(<StaffDisplay noteId={null} />);

    const container = screen.getByLabelText('Empty musical staff');
    expect(container).toBeInTheDocument();
  });

  it('renders without crashing with a valid note', () => {
    render(<StaffDisplay noteId="C4" />);

    const container = screen.getByLabelText('Musical staff showing note C4');
    expect(container).toBeInTheDocument();
  });

  it('renders with correct container dimensions', () => {
    render(<StaffDisplay noteId="C4" />);

    const container = screen.getByLabelText('Musical staff showing note C4');
    expect(container).toHaveStyle({ width: '400px', height: '150px' });
  });

  it('renders notes with sharps correctly', () => {
    render(<StaffDisplay noteId="F#4" />);

    const container = screen.getByLabelText('Musical staff showing note F#4');
    expect(container).toBeInTheDocument();
  });

  it('renders notes with flats correctly', () => {
    render(<StaffDisplay noteId="Bb3" />);

    const container = screen.getByLabelText('Musical staff showing note Bb3');
    expect(container).toBeInTheDocument();
  });

  it('applies appropriate container classes', () => {
    render(<StaffDisplay noteId="C4" />);

    const container = screen.getByLabelText('Musical staff showing note C4');
    expect(container).toHaveClass('bg-white', 'rounded-lg', 'shadow-md');
  });
});

describe('getClefForNote - clef selection', () => {
  it('returns treble clef for octave 4', () => {
    expect(getClefForNote('C4')).toBe('treble');
    expect(getClefForNote('F#4')).toBe('treble');
    expect(getClefForNote('B4')).toBe('treble');
  });

  it('returns treble clef for octaves above 4', () => {
    expect(getClefForNote('C5')).toBe('treble');
    expect(getClefForNote('G6')).toBe('treble');
    expect(getClefForNote('C8')).toBe('treble');
  });

  it('returns bass clef for octave 3', () => {
    expect(getClefForNote('C3')).toBe('bass');
    expect(getClefForNote('Bb3')).toBe('bass');
    expect(getClefForNote('G3')).toBe('bass');
  });

  it('returns bass clef for octaves below 3', () => {
    expect(getClefForNote('C2')).toBe('bass');
    expect(getClefForNote('A1')).toBe('bass');
    expect(getClefForNote('A0')).toBe('bass');
  });

  it('handles accidentals correctly', () => {
    expect(getClefForNote('C#4')).toBe('treble');
    expect(getClefForNote('Db4')).toBe('treble');
    expect(getClefForNote('F#3')).toBe('bass');
    expect(getClefForNote('Ab2')).toBe('bass');
  });
});
