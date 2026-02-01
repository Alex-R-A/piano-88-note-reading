// hooks/useLessonEngine.ts
import { useCallback, useEffect, useRef } from 'react';
import { useLessonStore } from '@/stores/lessonStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAudio } from '@/hooks/useAudio';
import { generateNoteSet, extractPitchClass } from '@/utils/noteUtils';
import type { NoteId, PitchClass, FeedbackState, NoteStats } from '@/types';

// Default octave for playing clicked pitch classes
// (keyboard shows generic octave, so we use middle C octave for audio feedback)
const AUDIO_FEEDBACK_OCTAVE = 4;

// Timing constants (in milliseconds) per spec lines 285-298
const FEEDBACK_FLASH_DURATION = 800;
const FEEDBACK_FADE_DURATION = 200;
const SHOW_ANSWER_DURATION = 1000;

// Total time before advancing to next note
const TOTAL_FEEDBACK_TIME = FEEDBACK_FLASH_DURATION + FEEDBACK_FADE_DURATION;
const TOTAL_INCORRECT_WITH_ANSWER_TIME =
  TOTAL_FEEDBACK_TIME + SHOW_ANSWER_DURATION;

export interface LessonEngineStats {
  overall: number;
  perNote: Array<{ noteId: NoteId; stats: NoteStats }>;
}

export interface UseLessonEngineReturn {
  // Current state
  currentNote: NoteId | null;
  feedbackState: FeedbackState;
  isActive: boolean;
  correctPitchClass: PitchClass | null;

  // Actions
  handleKeyClick: (pitchClass: PitchClass) => void;
  startLesson: (noteSet?: NoteId[]) => void;
  endLesson: () => void;

  // Audio
  initializeAudio: () => Promise<void>;
  isAudioReady: boolean;

  // Stats for analytics
  stats: LessonEngineStats;
}

/**
 * Orchestrates the lesson flow: note selection, answer processing, feedback state transitions.
 * Connects to lessonStore actions and handles timing for feedback sequences.
 */
export function useLessonEngine(): UseLessonEngineReturn {
  // Store access
  const {
    currentNote,
    feedbackState,
    isActive,
    startLesson: storeStartLesson,
    selectNextNote,
    processAnswer,
    setFeedbackState,
    endLesson: storeEndLesson,
    getSessionStats,
  } = useLessonStore();

  const { showCorrectAnswer, selectedOctaves, includeSharpsFlats, audioEnabled } =
    useSettingsStore();

  // Audio playback
  const { playNote, initializeAudio, isReady: isAudioReady } = useAudio();

  // Timer refs for cleanup
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showAnswerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track the correct pitch class for "show answer" highlighting
  const correctPitchClassRef = useRef<PitchClass | null>(null);

  // Cleanup timers on unmount or when lesson ends
  const clearAllTimers = useCallback(() => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
    if (showAnswerTimerRef.current) {
      clearTimeout(showAnswerTimerRef.current);
      showAnswerTimerRef.current = null;
    }
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  /**
   * Handle key click - processes answer and triggers feedback sequence.
   * Timing per spec lines 285-299:
   * - Correct: green flash 800ms, fade 200ms, then advance
   * - Incorrect: red flash 800ms, fade 200ms
   *   - If showCorrectAnswer: blue highlight 1000ms, then advance
   *   - Else: advance immediately after fade
   */
  const handleKeyClick = useCallback(
    (pitchClass: PitchClass) => {
      // Ignore clicks during feedback or when no note displayed
      if (!currentNote || feedbackState !== 'none') {
        return;
      }

      // Store the correct pitch class for potential "show answer" highlighting
      correctPitchClassRef.current = extractPitchClass(currentNote);

      // Process the answer (updates store state)
      const isCorrect = processAnswer(pitchClass);

      // Play audio feedback if enabled
      // Per spec lines 285-299:
      // - Correct answer: play the displayed note
      // - Incorrect answer: play the clicked note (so user hears their mistake)
      if (audioEnabled && isAudioReady) {
        if (isCorrect) {
          // Play the displayed note
          playNote(currentNote);
        } else {
          // Play the clicked note (user's mistake) at default octave
          const clickedNoteId = `${pitchClass}${AUDIO_FEEDBACK_OCTAVE}` as NoteId;
          playNote(clickedNoteId);
        }
      }

      // Clear any existing timers
      clearAllTimers();

      if (isCorrect) {
        // Correct answer: flash green, then advance
        // Store already set feedbackState to 'correct'

        // After flash + fade, advance to next note
        advanceTimerRef.current = setTimeout(() => {
          selectNextNote();
          correctPitchClassRef.current = null;
        }, TOTAL_FEEDBACK_TIME);
      } else {
        // Incorrect answer: flash red
        // Store already set feedbackState to 'incorrect'

        if (showCorrectAnswer) {
          // After red flash + fade, show the correct answer with blue highlight
          showAnswerTimerRef.current = setTimeout(() => {
            setFeedbackState('showAnswer');

            // After showing answer, advance to next note
            advanceTimerRef.current = setTimeout(() => {
              selectNextNote();
              correctPitchClassRef.current = null;
            }, SHOW_ANSWER_DURATION);
          }, TOTAL_FEEDBACK_TIME);
        } else {
          // No show answer: just advance after feedback
          advanceTimerRef.current = setTimeout(() => {
            selectNextNote();
            correctPitchClassRef.current = null;
          }, TOTAL_FEEDBACK_TIME);
        }
      }
    },
    [
      currentNote,
      feedbackState,
      processAnswer,
      selectNextNote,
      setFeedbackState,
      showCorrectAnswer,
      clearAllTimers,
      audioEnabled,
      isAudioReady,
      playNote,
    ]
  );

  /**
   * Start a new lesson with the given note set.
   * If no note set provided, generates one from current settings.
   */
  const startLesson = useCallback(
    (noteSet?: NoteId[]) => {
      clearAllTimers();
      correctPitchClassRef.current = null;

      const notes =
        noteSet ||
        generateNoteSet([...selectedOctaves], includeSharpsFlats);

      storeStartLesson(notes);
    },
    [
      storeStartLesson,
      selectedOctaves,
      includeSharpsFlats,
      clearAllTimers,
    ]
  );

  /**
   * End the current lesson.
   */
  const endLesson = useCallback(() => {
    clearAllTimers();
    correctPitchClassRef.current = null;
    storeEndLesson();
  }, [storeEndLesson, clearAllTimers]);

  // Get current stats
  const stats = getSessionStats();

  return {
    currentNote,
    feedbackState,
    isActive,
    correctPitchClass: correctPitchClassRef.current,
    handleKeyClick,
    startLesson,
    endLesson,
    initializeAudio,
    isAudioReady,
    stats,
  };
}

// Export timing constants for testing
export {
  FEEDBACK_FLASH_DURATION,
  FEEDBACK_FADE_DURATION,
  SHOW_ANSWER_DURATION,
  TOTAL_FEEDBACK_TIME,
  TOTAL_INCORRECT_WITH_ANSWER_TIME,
};
