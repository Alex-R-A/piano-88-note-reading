// stores/lessonStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useLessonStore, BUFFER_SIZE } from './lessonStore';

describe('lessonStore', () => {
  // Reset store before each test
  beforeEach(() => {
    useLessonStore.setState({
      isActive: false,
      fullNoteSet: [],
      remainingNotes: new Set<string>(),
      errorWeights: new Map<string, number>(),
      recentBuffer: [],
      currentNote: null,
      stats: new Map(),
      feedbackState: 'none',
    });
  });

  describe('BUFFER_SIZE', () => {
    it('is set to 4 for anti-clustering', () => {
      expect(BUFFER_SIZE).toBe(4);
    });
  });

  describe('startLesson', () => {
    it('initializes lesson state with provided note set', () => {
      const noteSet = ['C4', 'D4', 'E4', 'F4', 'G4'];
      useLessonStore.getState().startLesson(noteSet);

      const state = useLessonStore.getState();
      expect(state.isActive).toBe(true);
      expect(state.fullNoteSet).toEqual(noteSet);
      expect(state.remainingNotes.size).toBe(noteSet.length);
      expect(state.errorWeights.size).toBe(0);
      expect(state.recentBuffer.length).toBe(0);
      expect(state.stats.size).toBe(0);
    });

    it('selects first note automatically', () => {
      const noteSet = ['C4', 'D4', 'E4'];
      useLessonStore.getState().startLesson(noteSet);

      const state = useLessonStore.getState();
      expect(state.currentNote).not.toBeNull();
      expect(noteSet).toContain(state.currentNote);
    });

    it('sets feedbackState to none', () => {
      useLessonStore.getState().startLesson(['C4', 'D4']);
      expect(useLessonStore.getState().feedbackState).toBe('none');
    });
  });

  describe('selectNextNote', () => {
    it('selects a note from the note set', () => {
      const noteSet = ['C4', 'D4', 'E4', 'F4', 'G4'];
      useLessonStore.getState().startLesson(noteSet);

      // Select multiple notes to verify randomness stays within set
      for (let i = 0; i < 20; i++) {
        useLessonStore.getState().selectNextNote();
        expect(noteSet).toContain(useLessonStore.getState().currentNote);
      }
    });

    it('does nothing when lesson is not active', () => {
      useLessonStore.setState({ isActive: false, fullNoteSet: ['C4'] });
      useLessonStore.getState().selectNextNote();
      expect(useLessonStore.getState().currentNote).toBeNull();
    });

    it('does nothing when note set is empty', () => {
      useLessonStore.setState({ isActive: true, fullNoteSet: [] });
      useLessonStore.getState().selectNextNote();
      expect(useLessonStore.getState().currentNote).toBeNull();
    });

    it('resets feedbackState to none', () => {
      useLessonStore.getState().startLesson(['C4', 'D4', 'E4', 'F4', 'G4']);
      useLessonStore.setState({ feedbackState: 'correct' });
      useLessonStore.getState().selectNextNote();
      expect(useLessonStore.getState().feedbackState).toBe('none');
    });
  });

  describe('processAnswer', () => {
    beforeEach(() => {
      useLessonStore
        .getState()
        .startLesson(['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4']);
    });

    it('returns true for correct answer', () => {
      useLessonStore.setState({ currentNote: 'C4' });
      const result = useLessonStore.getState().processAnswer('C');
      expect(result).toBe(true);
    });

    it('returns false for incorrect answer', () => {
      useLessonStore.setState({ currentNote: 'C4' });
      const result = useLessonStore.getState().processAnswer('D');
      expect(result).toBe(false);
    });

    it('accepts enharmonic equivalents as correct', () => {
      useLessonStore.setState({
        currentNote: 'C#4',
        fullNoteSet: ['C#4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'],
        remainingNotes: new Set(['C#4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4']),
      });
      const result = useLessonStore.getState().processAnswer('Db');
      expect(result).toBe(true);
    });

    it('updates stats for correct answer', () => {
      useLessonStore.setState({ currentNote: 'C4' });
      useLessonStore.getState().processAnswer('C');

      const stats = useLessonStore.getState().stats.get('C4');
      expect(stats).toEqual({ shown: 1, correct: 1 });
    });

    it('updates stats for incorrect answer', () => {
      useLessonStore.setState({ currentNote: 'C4' });
      useLessonStore.getState().processAnswer('D');

      const stats = useLessonStore.getState().stats.get('C4');
      expect(stats).toEqual({ shown: 1, correct: 0 });
    });

    it('increments error weight on wrong answer', () => {
      useLessonStore.setState({ currentNote: 'C4' });
      useLessonStore.getState().processAnswer('D');

      expect(useLessonStore.getState().errorWeights.get('C4')).toBe(1);
    });

    it('does not increment error weight on correct answer', () => {
      useLessonStore.setState({ currentNote: 'C4' });
      useLessonStore.getState().processAnswer('C');

      expect(useLessonStore.getState().errorWeights.get('C4')).toBeUndefined();
    });

    it('accumulates error weights', () => {
      useLessonStore.setState({ currentNote: 'C4' });
      useLessonStore.getState().processAnswer('D');
      useLessonStore.setState({ currentNote: 'C4' });
      useLessonStore.getState().processAnswer('E');
      useLessonStore.setState({ currentNote: 'C4' });
      useLessonStore.getState().processAnswer('F');

      expect(useLessonStore.getState().errorWeights.get('C4')).toBe(3);
    });

    it('removes note from remainingNotes', () => {
      useLessonStore.setState({ currentNote: 'C4' });
      useLessonStore.getState().processAnswer('C');

      expect(useLessonStore.getState().remainingNotes.has('C4')).toBe(false);
    });

    it('adds note to recentBuffer', () => {
      useLessonStore.setState({ currentNote: 'C4' });
      useLessonStore.getState().processAnswer('C');

      expect(useLessonStore.getState().recentBuffer).toContain('C4');
    });

    it('sets feedbackState to correct on correct answer', () => {
      useLessonStore.setState({ currentNote: 'C4' });
      useLessonStore.getState().processAnswer('C');

      expect(useLessonStore.getState().feedbackState).toBe('correct');
    });

    it('sets feedbackState to incorrect on wrong answer', () => {
      useLessonStore.setState({ currentNote: 'C4' });
      useLessonStore.getState().processAnswer('D');

      expect(useLessonStore.getState().feedbackState).toBe('incorrect');
    });

    it('returns false when no current note', () => {
      useLessonStore.setState({ currentNote: null });
      const result = useLessonStore.getState().processAnswer('C');
      expect(result).toBe(false);
    });
  });

  describe('cycle completion', () => {
    it('refills remainingNotes when all notes have been shown', () => {
      const noteSet = ['C4', 'D4', 'E4'];
      useLessonStore.getState().startLesson(noteSet);

      // Process all notes
      for (const note of noteSet) {
        useLessonStore.setState({ currentNote: note });
        useLessonStore.getState().processAnswer(note.replace(/\d/, '')); // Extract pitch class
      }

      // All notes should be back in remainingNotes
      expect(useLessonStore.getState().remainingNotes.size).toBe(3);
    });

    it('preserves buffer across cycles', () => {
      const noteSet = ['C4', 'D4', 'E4', 'F4', 'G4'];
      useLessonStore.getState().startLesson(noteSet);

      // Process 4 notes to fill buffer
      useLessonStore.setState({ currentNote: 'C4' });
      useLessonStore.getState().processAnswer('C');
      useLessonStore.setState({ currentNote: 'D4' });
      useLessonStore.getState().processAnswer('D');
      useLessonStore.setState({ currentNote: 'E4' });
      useLessonStore.getState().processAnswer('E');
      useLessonStore.setState({ currentNote: 'F4' });
      useLessonStore.getState().processAnswer('F');

      const bufferBeforeCycle = [...useLessonStore.getState().recentBuffer];

      // Complete the cycle
      useLessonStore.setState({ currentNote: 'G4' });
      useLessonStore.getState().processAnswer('G');

      // Buffer should have shifted but still have 4 elements
      expect(useLessonStore.getState().recentBuffer.length).toBe(4);
      // Buffer should not be cleared
      expect(useLessonStore.getState().recentBuffer[0]).toBe(
        bufferBeforeCycle[1]
      );
    });
  });

  describe('anti-clustering (recentBuffer)', () => {
    it('maintains buffer at BUFFER_SIZE', () => {
      const noteSet = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'];
      useLessonStore.getState().startLesson(noteSet);

      // Process more notes than BUFFER_SIZE
      for (let i = 0; i < 6; i++) {
        useLessonStore.setState({ currentNote: noteSet[i] });
        useLessonStore.getState().processAnswer(noteSet[i].replace(/\d/, ''));
      }

      expect(useLessonStore.getState().recentBuffer.length).toBe(BUFFER_SIZE);
    });

    it('uses FIFO for buffer eviction', () => {
      const noteSet = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4'];
      useLessonStore.getState().startLesson(noteSet);

      // Fill buffer with C4, D4, E4, F4
      for (let i = 0; i < 4; i++) {
        useLessonStore.setState({ currentNote: noteSet[i] });
        useLessonStore.getState().processAnswer(noteSet[i].replace(/\d/, ''));
      }

      expect(useLessonStore.getState().recentBuffer).toEqual([
        'C4',
        'D4',
        'E4',
        'F4',
      ]);

      // Add G4, should evict C4
      useLessonStore.setState({ currentNote: 'G4' });
      useLessonStore.getState().processAnswer('G');

      expect(useLessonStore.getState().recentBuffer).toEqual([
        'D4',
        'E4',
        'F4',
        'G4',
      ]);
    });

    it('avoids selecting notes in buffer', () => {
      // Use a set larger than buffer size
      const noteSet = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'];
      useLessonStore.getState().startLesson(noteSet);

      // Fill buffer
      useLessonStore.setState({
        recentBuffer: ['C4', 'D4', 'E4', 'F4'],
        remainingNotes: new Set(['G4', 'A4', 'B4']),
      });

      // Run multiple selections - none should be in buffer
      for (let i = 0; i < 20; i++) {
        useLessonStore.getState().selectNextNote();
        const current = useLessonStore.getState().currentNote;
        expect(['G4', 'A4', 'B4']).toContain(current);
      }
    });
  });

  describe('edge cases - small note sets', () => {
    it('handles note set smaller than BUFFER_SIZE', () => {
      const noteSet = ['C4', 'D4']; // Only 2 notes, buffer is 4
      useLessonStore.getState().startLesson(noteSet);

      // Should still work without infinite loop
      for (let i = 0; i < 10; i++) {
        const current = useLessonStore.getState().currentNote;
        expect(noteSet).toContain(current);
        useLessonStore.getState().processAnswer(current!.replace(/\d/, ''));
        useLessonStore.getState().selectNextNote();
      }
    });

    it('avoids back-to-back same note when possible', () => {
      const noteSet = ['C4', 'D4', 'E4']; // 3 notes
      useLessonStore.getState().startLesson(noteSet);

      let lastNote = useLessonStore.getState().currentNote;
      let backToBackCount = 0;

      for (let i = 0; i < 50; i++) {
        useLessonStore.getState().processAnswer(lastNote!.replace(/\d/, ''));
        useLessonStore.getState().selectNextNote();
        const current = useLessonStore.getState().currentNote;
        if (current === lastNote) {
          backToBackCount++;
        }
        lastNote = current;
      }

      // With 3 notes and proper anti-clustering, should rarely have back-to-back
      expect(backToBackCount).toBeLessThan(5);
    });

    it('handles single note set gracefully', () => {
      const noteSet = ['C4'];
      useLessonStore.getState().startLesson(noteSet);

      expect(useLessonStore.getState().currentNote).toBe('C4');

      // Can still process and select
      useLessonStore.getState().processAnswer('C');
      useLessonStore.getState().selectNextNote();
      expect(useLessonStore.getState().currentNote).toBe('C4');
    });
  });

  describe('weighted selection', () => {
    it('includes error-weighted notes in candidate pool', () => {
      // This test verifies weighted selection indirectly
      const noteSet = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'];
      useLessonStore.getState().startLesson(noteSet);

      // Mark C4 with high error weight
      useLessonStore.setState({
        errorWeights: new Map([['C4', 10]]),
        remainingNotes: new Set(['D4', 'E4', 'F4', 'G4', 'A4', 'B4']),
        recentBuffer: [],
      });

      // Select many times and count C4 occurrences
      let c4Count = 0;
      for (let i = 0; i < 100; i++) {
        useLessonStore.getState().selectNextNote();
        if (useLessonStore.getState().currentNote === 'C4') {
          c4Count++;
        }
      }

      // C4 should appear more frequently than uniform random (1/7 ~ 14%)
      // With weight 10, it should appear much more often
      expect(c4Count).toBeGreaterThan(30);
    });
  });

  describe('setFeedbackState', () => {
    it('sets feedbackState to any valid value', () => {
      useLessonStore.getState().setFeedbackState('correct');
      expect(useLessonStore.getState().feedbackState).toBe('correct');

      useLessonStore.getState().setFeedbackState('incorrect');
      expect(useLessonStore.getState().feedbackState).toBe('incorrect');

      useLessonStore.getState().setFeedbackState('showAnswer');
      expect(useLessonStore.getState().feedbackState).toBe('showAnswer');

      useLessonStore.getState().setFeedbackState('none');
      expect(useLessonStore.getState().feedbackState).toBe('none');
    });
  });

  describe('endLesson', () => {
    it('sets isActive to false', () => {
      useLessonStore.getState().startLesson(['C4', 'D4', 'E4']);
      useLessonStore.getState().endLesson();
      expect(useLessonStore.getState().isActive).toBe(false);
    });

    it('clears currentNote', () => {
      useLessonStore.getState().startLesson(['C4', 'D4', 'E4']);
      useLessonStore.getState().endLesson();
      expect(useLessonStore.getState().currentNote).toBeNull();
    });

    it('sets feedbackState to none', () => {
      useLessonStore.getState().startLesson(['C4', 'D4', 'E4']);
      useLessonStore.setState({ feedbackState: 'correct' });
      useLessonStore.getState().endLesson();
      expect(useLessonStore.getState().feedbackState).toBe('none');
    });

    it('preserves stats for analytics', () => {
      useLessonStore.getState().startLesson(['C4', 'D4', 'E4']);
      useLessonStore.setState({ currentNote: 'C4' });
      useLessonStore.getState().processAnswer('C');

      useLessonStore.getState().endLesson();

      const stats = useLessonStore.getState().stats;
      expect(stats.get('C4')).toEqual({ shown: 1, correct: 1 });
    });
  });

  describe('getSessionStats', () => {
    beforeEach(() => {
      useLessonStore.getState().startLesson(['C4', 'D4', 'E4', 'F4', 'G4']);
    });

    it('calculates overall accuracy correctly', () => {
      // 2 correct, 2 wrong out of 4 = 50%
      useLessonStore.setState({ currentNote: 'C4' });
      useLessonStore.getState().processAnswer('C'); // correct
      useLessonStore.setState({ currentNote: 'D4' });
      useLessonStore.getState().processAnswer('D'); // correct
      useLessonStore.setState({ currentNote: 'E4' });
      useLessonStore.getState().processAnswer('F'); // wrong
      useLessonStore.setState({ currentNote: 'F4' });
      useLessonStore.getState().processAnswer('A'); // wrong

      const { overall } = useLessonStore.getState().getSessionStats();
      expect(overall).toBe(50);
    });

    it('returns 0 when no notes answered', () => {
      const { overall } = useLessonStore.getState().getSessionStats();
      expect(overall).toBe(0);
    });

    it('returns per-note breakdown', () => {
      useLessonStore.setState({ currentNote: 'C4' });
      useLessonStore.getState().processAnswer('C');
      useLessonStore.setState({ currentNote: 'C4' });
      useLessonStore.getState().processAnswer('D');

      const { perNote } = useLessonStore.getState().getSessionStats();
      const c4Stats = perNote.find((n) => n.noteId === 'C4');

      expect(c4Stats).toBeDefined();
      expect(c4Stats!.stats.shown).toBe(2);
      expect(c4Stats!.stats.correct).toBe(1);
    });

    it('includes all notes that were shown', () => {
      useLessonStore.setState({ currentNote: 'C4' });
      useLessonStore.getState().processAnswer('C');
      useLessonStore.setState({ currentNote: 'D4' });
      useLessonStore.getState().processAnswer('D');
      useLessonStore.setState({ currentNote: 'E4' });
      useLessonStore.getState().processAnswer('E');

      const { perNote } = useLessonStore.getState().getSessionStats();
      expect(perNote.length).toBe(3);
    });

    it('calculates 100% accuracy correctly', () => {
      useLessonStore.setState({ currentNote: 'C4' });
      useLessonStore.getState().processAnswer('C');
      useLessonStore.setState({ currentNote: 'D4' });
      useLessonStore.getState().processAnswer('D');

      const { overall } = useLessonStore.getState().getSessionStats();
      expect(overall).toBe(100);
    });
  });
});
