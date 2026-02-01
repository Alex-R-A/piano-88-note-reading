// stores/lessonStore.ts
import { create } from 'zustand';
import type { NoteId, NoteStats, PitchClass, FeedbackState } from '@/types';
import { extractPitchClass, areEnharmonic } from '@/utils/noteUtils';

const BUFFER_SIZE = 4; // Minimum gap before note can repeat

interface LessonStore {
  // State (matches LessonState from types)
  isActive: boolean;
  fullNoteSet: NoteId[];
  remainingNotes: Set<NoteId>;
  errorWeights: Map<NoteId, number>;
  recentBuffer: NoteId[];
  currentNote: NoteId | null;
  noteSelectionId: number; // Increments each time a note is selected
  stats: Map<NoteId, NoteStats>;
  feedbackState: FeedbackState;

  // Actions
  startLesson: (noteSet: NoteId[]) => void;
  selectNextNote: () => void;
  processAnswer: (clickedPitchClass: PitchClass) => boolean;
  setFeedbackState: (state: FeedbackState) => void;
  endLesson: () => void;
  getSessionStats: () => {
    overall: number;
    perNote: Array<{ noteId: NoteId; stats: NoteStats }>;
  };
}

/**
 * Select the next note using weighted random selection with anti-clustering.
 * Implements spec lines 449-477.
 * Never selects the same note twice in a row unless it's a single-note set.
 */
function selectNextNoteFromState(state: {
  fullNoteSet: NoteId[];
  remainingNotes: Set<NoteId>;
  errorWeights: Map<NoteId, number>;
  recentBuffer: NoteId[];
  currentNote: NoteId | null;
}): NoteId {
  // 1. Build candidate pool
  const candidates: NoteId[] = [];

  // Add remaining notes (not yet shown this cycle)
  for (const note of state.remainingNotes) {
    candidates.push(note);
  }

  // Add weighted wrong notes (already shown but missed)
  // Each error weight adds that note multiple times conceptually
  for (const [note, weight] of state.errorWeights) {
    for (let i = 0; i < weight; i++) {
      candidates.push(note);
    }
  }

  // 2. Filter out recently shown notes (anti-clustering)
  // Also explicitly exclude the current note to prevent back-to-back repeats
  let filtered = candidates.filter(
    (note) => !state.recentBuffer.includes(note) && note !== state.currentNote
  );

  // 3. Handle edge case: all candidates filtered out
  // This can happen if note set is very small (< BUFFER_SIZE)
  if (filtered.length === 0) {
    // Fall back to any note except the current one
    filtered = state.fullNoteSet.filter((note) => note !== state.currentNote);

    // Ultimate fallback: if still empty (single-note set), use the only note
    if (filtered.length === 0) {
      filtered = [...state.fullNoteSet];
    }
  }

  // 4. Random selection from candidates
  const index = Math.floor(Math.random() * filtered.length);
  return filtered[index];
}

export const useLessonStore = create<LessonStore>((set, get) => ({
  // Initial state
  isActive: false,
  fullNoteSet: [],
  remainingNotes: new Set<NoteId>(),
  errorWeights: new Map<NoteId, number>(),
  recentBuffer: [],
  currentNote: null,
  noteSelectionId: 0,
  stats: new Map<NoteId, NoteStats>(),
  feedbackState: 'none',

  startLesson: (noteSet: NoteId[]) => {
    set({
      isActive: true,
      fullNoteSet: noteSet,
      remainingNotes: new Set(noteSet),
      errorWeights: new Map(),
      recentBuffer: [],
      currentNote: null,
      noteSelectionId: 0,
      stats: new Map(),
      feedbackState: 'none',
    });

    // Immediately select first note
    get().selectNextNote();
  },

  selectNextNote: () => {
    const state = get();
    if (!state.isActive || state.fullNoteSet.length === 0) return;

    const nextNote = selectNextNoteFromState({
      fullNoteSet: state.fullNoteSet,
      remainingNotes: state.remainingNotes,
      errorWeights: state.errorWeights,
      recentBuffer: state.recentBuffer,
      currentNote: state.currentNote,
    });

    set((state) => ({
      currentNote: nextNote,
      feedbackState: 'none',
      noteSelectionId: state.noteSelectionId + 1,
    }));
  },

  processAnswer: (clickedPitchClass: PitchClass): boolean => {
    const state = get();
    const note = state.currentNote;
    if (!note) return false;

    // Validate answer: check pitch class match or enharmonic equivalent
    const displayedPitchClass = extractPitchClass(note);
    const isCorrect =
      displayedPitchClass === clickedPitchClass ||
      areEnharmonic(displayedPitchClass, clickedPitchClass);

    // Update statistics
    const currentStats = state.stats.get(note) || { shown: 0, correct: 0 };
    const newStats = {
      shown: currentStats.shown + 1,
      correct: isCorrect ? currentStats.correct + 1 : currentStats.correct,
    };

    const newStatsMap = new Map(state.stats);
    newStatsMap.set(note, newStats);

    // Update error weights for wrong answers
    const newErrorWeights = new Map(state.errorWeights);
    if (!isCorrect) {
      const currentWeight = newErrorWeights.get(note) || 0;
      newErrorWeights.set(note, currentWeight + 1);
    }

    // Update remaining notes
    const newRemainingNotes = new Set(state.remainingNotes);
    newRemainingNotes.delete(note);

    // Check for cycle completion
    if (newRemainingNotes.size === 0) {
      // Refill remaining notes for new cycle (buffer persists)
      for (const n of state.fullNoteSet) {
        newRemainingNotes.add(n);
      }
    }

    // Update recent buffer (maintain FIFO, max size = BUFFER_SIZE)
    const newBuffer = [...state.recentBuffer, note];
    if (newBuffer.length > BUFFER_SIZE) {
      newBuffer.shift(); // Remove oldest
    }

    set({
      stats: newStatsMap,
      errorWeights: newErrorWeights,
      remainingNotes: newRemainingNotes,
      recentBuffer: newBuffer,
      feedbackState: isCorrect ? 'correct' : 'incorrect',
    });

    return isCorrect;
  },

  setFeedbackState: (feedbackState: FeedbackState) => {
    set({ feedbackState });
  },

  endLesson: () => {
    set({
      isActive: false,
      currentNote: null,
      feedbackState: 'none',
    });
  },

  getSessionStats: () => {
    const state = get();
    let totalShown = 0;
    let totalCorrect = 0;

    const perNote: Array<{ noteId: NoteId; stats: NoteStats }> = [];

    for (const [noteId, noteStats] of state.stats) {
      totalShown += noteStats.shown;
      totalCorrect += noteStats.correct;
      perNote.push({ noteId, stats: noteStats });
    }

    const overall = totalShown > 0 ? (totalCorrect / totalShown) * 100 : 0;

    return { overall, perNote };
  },
}));

// Export BUFFER_SIZE for testing
export { BUFFER_SIZE };
