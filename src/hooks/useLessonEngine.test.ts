// hooks/useLessonEngine.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useLessonEngine,
  FEEDBACK_FLASH_DURATION,
  FEEDBACK_FADE_DURATION,
  SHOW_ANSWER_DURATION,
  TOTAL_FEEDBACK_TIME,
} from './useLessonEngine';
import { useLessonStore } from '@/stores/lessonStore';
import { useSettingsStore } from '@/stores/settingsStore';

describe('useLessonEngine', () => {
  beforeEach(() => {
    vi.useFakeTimers();

    // Reset stores to initial state
    useLessonStore.setState({
      isActive: false,
      fullNoteSet: [],
      remainingNotes: new Set(),
      errorWeights: new Map(),
      recentBuffer: [],
      currentNote: null,
      stats: new Map(),
      feedbackState: 'none',
    });

    useSettingsStore.setState({
      selectedOctaves: new Set([4]),
      includeSharpsFlats: false,
      audioEnabled: true,
      showCorrectAnswer: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('startLesson', () => {
    it('should start a lesson with provided note set', () => {
      const { result } = renderHook(() => useLessonEngine());

      act(() => {
        result.current.startLesson(['C4', 'D4', 'E4']);
      });

      expect(result.current.isActive).toBe(true);
      expect(result.current.currentNote).not.toBeNull();
      expect(['C4', 'D4', 'E4']).toContain(result.current.currentNote);
    });

    it('should generate note set from settings if none provided', () => {
      useSettingsStore.setState({
        selectedOctaves: new Set([4]),
        includeSharpsFlats: false,
      });

      const { result } = renderHook(() => useLessonEngine());

      act(() => {
        result.current.startLesson();
      });

      expect(result.current.isActive).toBe(true);
      // Should have 7 natural notes from octave 4
      const store = useLessonStore.getState();
      expect(store.fullNoteSet).toHaveLength(7);
    });

    it('should include sharps/flats when enabled', () => {
      useSettingsStore.setState({
        selectedOctaves: new Set([4]),
        includeSharpsFlats: true,
      });

      const { result } = renderHook(() => useLessonEngine());

      act(() => {
        result.current.startLesson();
      });

      const store = useLessonStore.getState();
      // 7 naturals + 10 accidentals (5 black keys * 2 spellings)
      expect(store.fullNoteSet).toHaveLength(17);
    });
  });

  describe('endLesson', () => {
    it('should end the lesson and clear state', () => {
      const { result } = renderHook(() => useLessonEngine());

      act(() => {
        result.current.startLesson(['C4', 'D4', 'E4']);
      });

      expect(result.current.isActive).toBe(true);

      act(() => {
        result.current.endLesson();
      });

      expect(result.current.isActive).toBe(false);
    });
  });

  describe('handleKeyClick - correct answer', () => {
    it('should set feedback to correct when answer is right', () => {
      const { result } = renderHook(() => useLessonEngine());

      act(() => {
        result.current.startLesson(['C4']);
      });

      expect(result.current.currentNote).toBe('C4');
      expect(result.current.feedbackState).toBe('none');

      act(() => {
        result.current.handleKeyClick('C');
      });

      expect(result.current.feedbackState).toBe('correct');
    });

    it('should auto-advance after feedback timing completes', () => {
      const { result } = renderHook(() => useLessonEngine());

      act(() => {
        result.current.startLesson(['C4', 'D4', 'E4', 'F4', 'G4']);
      });

      const firstNote = result.current.currentNote;

      // Answer correctly
      act(() => {
        result.current.handleKeyClick(firstNote!.replace(/\d/, ''));
      });

      expect(result.current.feedbackState).toBe('correct');

      // Advance timer past feedback time
      act(() => {
        vi.advanceTimersByTime(TOTAL_FEEDBACK_TIME);
      });

      // Should have advanced to next note
      expect(result.current.feedbackState).toBe('none');
      // Note may or may not have changed due to random selection
    });

    it('should accept enharmonic equivalents as correct', () => {
      // Force store to have C# as current note before rendering hook
      useLessonStore.setState({
        isActive: true,
        fullNoteSet: ['C#4'],
        remainingNotes: new Set(['C#4']),
        errorWeights: new Map(),
        recentBuffer: [],
        currentNote: 'C#4',
        stats: new Map(),
        feedbackState: 'none',
      });

      const { result } = renderHook(() => useLessonEngine());

      expect(result.current.currentNote).toBe('C#4');

      act(() => {
        result.current.handleKeyClick('Db'); // Enharmonic equivalent
      });

      expect(result.current.feedbackState).toBe('correct');
    });
  });

  describe('handleKeyClick - incorrect answer', () => {
    it('should set feedback to incorrect when answer is wrong', () => {
      useLessonStore.setState({
        isActive: true,
        fullNoteSet: ['C4', 'D4', 'E4', 'F4', 'G4'],
        remainingNotes: new Set(['C4', 'D4', 'E4', 'F4', 'G4']),
        errorWeights: new Map(),
        recentBuffer: [],
        currentNote: 'C4',
        stats: new Map(),
        feedbackState: 'none',
      });

      const { result } = renderHook(() => useLessonEngine());

      act(() => {
        result.current.handleKeyClick('D'); // Wrong - current is C4
      });

      expect(result.current.feedbackState).toBe('incorrect');
    });

    it('should auto-advance after feedback when showCorrectAnswer is OFF', () => {
      useSettingsStore.setState({ showCorrectAnswer: false });
      useLessonStore.setState({
        isActive: true,
        fullNoteSet: ['C4', 'D4', 'E4', 'F4', 'G4'],
        remainingNotes: new Set(['C4', 'D4', 'E4', 'F4', 'G4']),
        errorWeights: new Map(),
        recentBuffer: [],
        currentNote: 'C4',
        stats: new Map(),
        feedbackState: 'none',
      });

      const { result } = renderHook(() => useLessonEngine());

      act(() => {
        result.current.handleKeyClick('D'); // Wrong
      });

      expect(result.current.feedbackState).toBe('incorrect');

      // Advance past feedback time
      act(() => {
        vi.advanceTimersByTime(TOTAL_FEEDBACK_TIME);
      });

      // Should have advanced (feedbackState resets to 'none')
      expect(result.current.feedbackState).toBe('none');
    });
  });

  describe('handleKeyClick - showCorrectAnswer enabled', () => {
    beforeEach(() => {
      useSettingsStore.setState({ showCorrectAnswer: true });
      useLessonStore.setState({
        isActive: true,
        fullNoteSet: ['C4', 'D4', 'E4', 'F4', 'G4'],
        remainingNotes: new Set(['C4', 'D4', 'E4', 'F4', 'G4']),
        errorWeights: new Map(),
        recentBuffer: [],
        currentNote: 'C4',
        stats: new Map(),
        feedbackState: 'none',
      });
    });

    it('should transition to showAnswer state after incorrect feedback', () => {
      const { result } = renderHook(() => useLessonEngine());

      act(() => {
        result.current.handleKeyClick('D'); // Wrong
      });

      expect(result.current.feedbackState).toBe('incorrect');

      // Advance past feedback flash + fade time
      act(() => {
        vi.advanceTimersByTime(TOTAL_FEEDBACK_TIME);
      });

      // Should now be showing answer
      expect(result.current.feedbackState).toBe('showAnswer');
    });

    it('should auto-advance after showAnswer duration', () => {
      const { result } = renderHook(() => useLessonEngine());

      act(() => {
        result.current.handleKeyClick('D'); // Wrong
      });

      // Advance to showAnswer
      act(() => {
        vi.advanceTimersByTime(TOTAL_FEEDBACK_TIME);
      });

      expect(result.current.feedbackState).toBe('showAnswer');

      // Advance past showAnswer duration
      act(() => {
        vi.advanceTimersByTime(SHOW_ANSWER_DURATION);
      });

      // Should have advanced to next note
      expect(result.current.feedbackState).toBe('none');
    });

    it('should maintain correct timing: 800ms flash + 200ms fade + 1000ms show', () => {
      const { result } = renderHook(() => useLessonEngine());

      act(() => {
        result.current.handleKeyClick('D'); // Wrong
      });

      // Still in incorrect state at 999ms
      act(() => {
        vi.advanceTimersByTime(FEEDBACK_FLASH_DURATION + FEEDBACK_FADE_DURATION - 1);
      });
      expect(result.current.feedbackState).toBe('incorrect');

      // Transitions at 1000ms
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(result.current.feedbackState).toBe('showAnswer');

      // Still showing answer at 1999ms
      act(() => {
        vi.advanceTimersByTime(SHOW_ANSWER_DURATION - 1);
      });
      expect(result.current.feedbackState).toBe('showAnswer');

      // Advances at 2000ms
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(result.current.feedbackState).toBe('none');
    });
  });

  describe('click handling during feedback', () => {
    it('should ignore clicks during feedback state', () => {
      useLessonStore.setState({
        isActive: true,
        fullNoteSet: ['C4', 'D4', 'E4', 'F4', 'G4'],
        remainingNotes: new Set(['C4', 'D4', 'E4', 'F4', 'G4']),
        errorWeights: new Map(),
        recentBuffer: [],
        currentNote: 'C4',
        stats: new Map(),
        feedbackState: 'none',
      });

      const { result } = renderHook(() => useLessonEngine());

      // Trigger feedback
      act(() => {
        result.current.handleKeyClick('C');
      });

      expect(result.current.feedbackState).toBe('correct');

      // Try to click again during feedback - should be ignored
      // The hook checks feedbackState !== 'none' before calling processAnswer
      // The click should simply be ignored
      act(() => {
        result.current.handleKeyClick('D');
      });

      expect(result.current.feedbackState).toBe('correct');
    });

    it('should ignore clicks when no current note', () => {
      const { result } = renderHook(() => useLessonEngine());

      // Don't start lesson, so currentNote is null
      expect(result.current.currentNote).toBeNull();

      act(() => {
        result.current.handleKeyClick('C');
      });

      // Should still be in initial state
      expect(result.current.feedbackState).toBe('none');
      expect(result.current.isActive).toBe(false);
    });
  });

  describe('stats', () => {
    it('should track correct and incorrect answers', () => {
      useLessonStore.setState({
        isActive: true,
        fullNoteSet: ['C4', 'D4', 'E4', 'F4', 'G4'],
        remainingNotes: new Set(['C4', 'D4', 'E4', 'F4', 'G4']),
        errorWeights: new Map(),
        recentBuffer: [],
        currentNote: 'C4',
        stats: new Map(),
        feedbackState: 'none',
      });

      const { result } = renderHook(() => useLessonEngine());

      // Answer correctly
      act(() => {
        result.current.handleKeyClick('C');
      });

      // Wait for feedback to complete
      act(() => {
        vi.advanceTimersByTime(TOTAL_FEEDBACK_TIME);
      });

      const stats = result.current.stats;
      expect(stats.perNote.length).toBeGreaterThan(0);

      const c4Stats = stats.perNote.find((s) => s.noteId === 'C4');
      expect(c4Stats).toBeDefined();
      expect(c4Stats!.stats.shown).toBe(1);
      expect(c4Stats!.stats.correct).toBe(1);
    });

    it('should calculate overall accuracy', () => {
      const statsMap = new Map();
      statsMap.set('C4', { shown: 10, correct: 8 });
      statsMap.set('D4', { shown: 10, correct: 5 });

      useLessonStore.setState({
        isActive: true,
        fullNoteSet: ['C4', 'D4'],
        remainingNotes: new Set(['C4', 'D4']),
        errorWeights: new Map(),
        recentBuffer: [],
        currentNote: 'C4',
        stats: statsMap,
        feedbackState: 'none',
      });

      const { result } = renderHook(() => useLessonEngine());

      const stats = result.current.stats;
      // 13 correct out of 20 = 65%
      expect(stats.overall).toBe(65);
    });
  });

  describe('timer cleanup', () => {
    it('should clear timers when lesson ends', () => {
      useLessonStore.setState({
        isActive: true,
        fullNoteSet: ['C4', 'D4', 'E4', 'F4', 'G4'],
        remainingNotes: new Set(['C4', 'D4', 'E4', 'F4', 'G4']),
        errorWeights: new Map(),
        recentBuffer: [],
        currentNote: 'C4',
        stats: new Map(),
        feedbackState: 'none',
      });

      const { result } = renderHook(() => useLessonEngine());

      // Trigger feedback
      act(() => {
        result.current.handleKeyClick('C');
      });

      // End lesson before feedback completes
      act(() => {
        result.current.endLesson();
      });

      // Advance time - should not cause issues
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Lesson should be ended
      expect(result.current.isActive).toBe(false);
    });

    it('should clear timers when starting new lesson', () => {
      const { result } = renderHook(() => useLessonEngine());

      act(() => {
        result.current.startLesson(['C4', 'D4', 'E4', 'F4', 'G4']);
      });

      // Get first note and answer correctly
      const firstNote = result.current.currentNote;
      act(() => {
        result.current.handleKeyClick(firstNote!.replace(/\d/, ''));
      });

      // Before feedback completes, start new lesson
      act(() => {
        result.current.startLesson(['A4', 'B4']);
      });

      // Should be in new lesson with fresh state
      expect(result.current.isActive).toBe(true);
      expect(result.current.feedbackState).toBe('none');

      // Advance time - old timers should not interfere
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.isActive).toBe(true);
    });
  });

  describe('timing constants', () => {
    it('should export correct timing constants per spec', () => {
      expect(FEEDBACK_FLASH_DURATION).toBe(800);
      expect(FEEDBACK_FADE_DURATION).toBe(200);
      expect(SHOW_ANSWER_DURATION).toBe(1000);
      expect(TOTAL_FEEDBACK_TIME).toBe(1000); // 800 + 200
    });
  });
});
