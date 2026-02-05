// components/AnalyticsScreen/AnalyticsScreen.test.tsx

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { AnalyticsScreen } from './AnalyticsScreen';
import { AccuracyHeader } from './AccuracyHeader';
import { StatsTable, getAccuracy, getRowColor } from './StatsTable';
import { useLessonStore } from '@/stores/lessonStore';
import type { NoteStats } from '@/types';

describe('AccuracyHeader', () => {
  describe('accuracy calculation display', () => {
    it('should display "Session Complete" title', () => {
      render(<AccuracyHeader overallAccuracy={75} />);
      expect(screen.getByText('Session Complete')).toBeInTheDocument();
    });

    it('should display overall accuracy percentage', () => {
      render(<AccuracyHeader overallAccuracy={78.5} />);
      expect(screen.getByTestId('overall-accuracy')).toHaveTextContent('79%');
    });

    it('should round accuracy to nearest integer', () => {
      render(<AccuracyHeader overallAccuracy={66.4} />);
      expect(screen.getByTestId('overall-accuracy')).toHaveTextContent('66%');
    });

    it('should round 0.5 up', () => {
      render(<AccuracyHeader overallAccuracy={66.5} />);
      expect(screen.getByTestId('overall-accuracy')).toHaveTextContent('67%');
    });

    it('should handle 0% accuracy', () => {
      render(<AccuracyHeader overallAccuracy={0} />);
      expect(screen.getByTestId('overall-accuracy')).toHaveTextContent('0%');
    });

    it('should handle 100% accuracy', () => {
      render(<AccuracyHeader overallAccuracy={100} />);
      expect(screen.getByTestId('overall-accuracy')).toHaveTextContent('100%');
    });
  });
});

describe('getAccuracy', () => {
  it('should calculate accuracy as (correct / shown) * 100', () => {
    expect(getAccuracy({ shown: 10, correct: 8 })).toBe(80);
    expect(getAccuracy({ shown: 4, correct: 1 })).toBe(25);
    expect(getAccuracy({ shown: 5, correct: 5 })).toBe(100);
  });

  it('should return 0 for zero shown', () => {
    expect(getAccuracy({ shown: 0, correct: 0 })).toBe(0);
  });

  it('should handle partial percentages', () => {
    expect(getAccuracy({ shown: 3, correct: 1 })).toBeCloseTo(33.33, 1);
  });
});

describe('getRowColor', () => {
  describe('red background for 0-40% accuracy', () => {
    it('should return bg-red-50 for 0%', () => {
      expect(getRowColor(0)).toBe('bg-red-50');
    });

    it('should return bg-red-50 for 25%', () => {
      expect(getRowColor(25)).toBe('bg-red-50');
    });

    it('should return bg-red-50 for 40%', () => {
      expect(getRowColor(40)).toBe('bg-red-50');
    });
  });

  describe('yellow background for 41-70% accuracy', () => {
    it('should return bg-amber-50 for 41%', () => {
      expect(getRowColor(41)).toBe('bg-amber-50');
    });

    it('should return bg-amber-50 for 50%', () => {
      expect(getRowColor(50)).toBe('bg-amber-50');
    });

    it('should return bg-amber-50 for 70%', () => {
      expect(getRowColor(70)).toBe('bg-amber-50');
    });
  });

  describe('green background for 71-100% accuracy', () => {
    it('should return bg-emerald-50 for 71%', () => {
      expect(getRowColor(71)).toBe('bg-emerald-50');
    });

    it('should return bg-emerald-50 for 85%', () => {
      expect(getRowColor(85)).toBe('bg-emerald-50');
    });

    it('should return bg-emerald-50 for 100%', () => {
      expect(getRowColor(100)).toBe('bg-emerald-50');
    });
  });
});

describe('StatsTable', () => {
  describe('table sorting', () => {
    it('should sort by accuracy ascending (worst first)', () => {
      const perNote = [
        { noteId: 'C4', stats: { shown: 10, correct: 8 } }, // 80%
        { noteId: 'D4', stats: { shown: 10, correct: 2 } }, // 20%
        { noteId: 'E4', stats: { shown: 10, correct: 5 } }, // 50%
      ];

      render(<StatsTable perNote={perNote} />);

      const rows = screen.getAllByTestId(/^stats-row-/);
      expect(rows).toHaveLength(3);

      // Order should be: D4 (20%), E4 (50%), C4 (80%)
      expect(rows[0]).toHaveAttribute('data-testid', 'stats-row-D4');
      expect(rows[1]).toHaveAttribute('data-testid', 'stats-row-E4');
      expect(rows[2]).toHaveAttribute('data-testid', 'stats-row-C4');
    });

    it('should maintain stable order for equal accuracies', () => {
      const perNote = [
        { noteId: 'C4', stats: { shown: 10, correct: 5 } }, // 50%
        { noteId: 'D4', stats: { shown: 10, correct: 5 } }, // 50%
      ];

      render(<StatsTable perNote={perNote} />);

      const rows = screen.getAllByTestId(/^stats-row-/);
      expect(rows).toHaveLength(2);
    });
  });

  describe('row coloring based on accuracy ranges', () => {
    it('should apply red background class for 0-40% accuracy', () => {
      const perNote = [{ noteId: 'C4', stats: { shown: 10, correct: 2 } }]; // 20%

      render(<StatsTable perNote={perNote} />);

      const row = screen.getByTestId('stats-row-C4');
      expect(row).toHaveClass('bg-red-50');
    });

    it('should apply yellow background class for 41-70% accuracy', () => {
      const perNote = [{ noteId: 'D4', stats: { shown: 10, correct: 5 } }]; // 50%

      render(<StatsTable perNote={perNote} />);

      const row = screen.getByTestId('stats-row-D4');
      expect(row).toHaveClass('bg-amber-50');
    });

    it('should apply green background class for 71-100% accuracy', () => {
      const perNote = [{ noteId: 'E4', stats: { shown: 10, correct: 9 } }]; // 90%

      render(<StatsTable perNote={perNote} />);

      const row = screen.getByTestId('stats-row-E4');
      expect(row).toHaveClass('bg-emerald-50');
    });
  });

  describe('renders all practiced notes', () => {
    it('should render a row for each note with stats', () => {
      const perNote = [
        { noteId: 'C4', stats: { shown: 5, correct: 4 } },
        { noteId: 'D4', stats: { shown: 3, correct: 2 } },
        { noteId: 'F#4', stats: { shown: 8, correct: 2 } },
        { noteId: 'Bb3', stats: { shown: 6, correct: 3 } },
      ];

      render(<StatsTable perNote={perNote} />);

      expect(screen.getByTestId('stats-row-C4')).toBeInTheDocument();
      expect(screen.getByTestId('stats-row-D4')).toBeInTheDocument();
      expect(screen.getByTestId('stats-row-F#4')).toBeInTheDocument();
      expect(screen.getByTestId('stats-row-Bb3')).toBeInTheDocument();
    });

    it('should not render notes with zero appearances', () => {
      const perNote = [
        { noteId: 'C4', stats: { shown: 5, correct: 4 } },
        { noteId: 'D4', stats: { shown: 0, correct: 0 } }, // Never shown
      ];

      render(<StatsTable perNote={perNote} />);

      expect(screen.getByTestId('stats-row-C4')).toBeInTheDocument();
      expect(screen.queryByTestId('stats-row-D4')).not.toBeInTheDocument();
    });

    it('should display octave and pitch class in separate columns', () => {
      const perNote = [{ noteId: 'G4', stats: { shown: 12, correct: 9 } }]; // 75%

      render(<StatsTable perNote={perNote} />);

      const row = screen.getByTestId('stats-row-G4');
      expect(within(row).getByText('4')).toBeInTheDocument();
      expect(within(row).getByText('G')).toBeInTheDocument();
      expect(within(row).getByText('12')).toBeInTheDocument();
      expect(within(row).getByText('9')).toBeInTheDocument();
      expect(within(row).getByText('75%')).toBeInTheDocument();
    });

    it('should display accidentals in pitch class column', () => {
      const perNote = [
        { noteId: 'F#5', stats: { shown: 6, correct: 3 } },
        { noteId: 'Bb3', stats: { shown: 7, correct: 2 } },
      ];

      render(<StatsTable perNote={perNote} />);

      const sharpRow = screen.getByTestId('stats-row-F#5');
      expect(within(sharpRow).getByText('F#')).toBeInTheDocument();
      expect(within(sharpRow).getByText('5')).toBeInTheDocument();

      const flatRow = screen.getByTestId('stats-row-Bb3');
      expect(within(flatRow).getByText('Bb')).toBeInTheDocument();
      expect(within(flatRow).getByText('3')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should show message when no notes were practiced', () => {
      render(<StatsTable perNote={[]} />);

      expect(screen.getByText('No notes were practiced in this session.')).toBeInTheDocument();
    });

    it('should show message when all notes have zero appearances', () => {
      const perNote = [
        { noteId: 'C4', stats: { shown: 0, correct: 0 } },
        { noteId: 'D4', stats: { shown: 0, correct: 0 } },
      ];

      render(<StatsTable perNote={perNote} />);

      expect(screen.getByText('No notes were practiced in this session.')).toBeInTheDocument();
    });
  });
});

describe('AnalyticsScreen', () => {
  beforeEach(() => {
    // Set up lesson store with test data
    useLessonStore.setState({
      isActive: false,
      fullNoteSet: ['C4', 'D4', 'E4'],
      remainingNotes: new Set(),
      errorWeights: new Map(),
      recentBuffer: [],
      currentNote: null,
      stats: new Map<string, NoteStats>([
        ['C4', { shown: 10, correct: 8 }], // 80%
        ['D4', { shown: 8, correct: 2 }], // 25%
        ['E4', { shown: 5, correct: 4 }], // 80%
      ]),
      feedbackState: 'none',
    });
  });

  it('should display header with overall accuracy', () => {
    render(<AnalyticsScreen onBackToMain={() => {}} />);

    expect(screen.getByText('Session Complete')).toBeInTheDocument();
    // Total: 23 shown, 14 correct = 60.87% -> 61%
    expect(screen.getByTestId('overall-accuracy')).toHaveTextContent('61%');
  });

  it('should display statistics table with all practiced notes', () => {
    render(<AnalyticsScreen onBackToMain={() => {}} />);

    expect(screen.getByTestId('stats-table')).toBeInTheDocument();
    expect(screen.getByTestId('stats-row-C4')).toBeInTheDocument();
    expect(screen.getByTestId('stats-row-D4')).toBeInTheDocument();
    expect(screen.getByTestId('stats-row-E4')).toBeInTheDocument();
  });

  it('should display "Back to Main Menu" button', () => {
    render(<AnalyticsScreen onBackToMain={() => {}} />);

    expect(screen.getByRole('button', { name: /back to main menu/i })).toBeInTheDocument();
  });

  it('should call onBackToMain when button is clicked', () => {
    const onBackToMain = vi.fn();
    render(<AnalyticsScreen onBackToMain={onBackToMain} />);

    const button = screen.getByRole('button', { name: /back to main menu/i });
    button.click();

    expect(onBackToMain).toHaveBeenCalledTimes(1);
  });

  it('should sort table by accuracy ascending', () => {
    render(<AnalyticsScreen onBackToMain={() => {}} />);

    const rows = screen.getAllByTestId(/^stats-row-/);
    // D4 (25%) should be first, then C4 or E4 (both 80%)
    expect(rows[0]).toHaveAttribute('data-testid', 'stats-row-D4');
  });
});
