// components/LessonScreen/LessonScreen.tsx
import { useEffect, useRef, useState } from 'react';
import { FeedbackOverlay } from './FeedbackOverlay';
import { StaffDisplay } from './StaffDisplay';
import { PianoKeyboard3D } from './PianoKeyboard3D';
import { Button } from '@/components/ui';
import { useLessonEngine } from '@/hooks';
import { useLessonStore } from '@/stores/lessonStore';
import type { PitchClass } from '@/types';

interface LessonScreenProps {
  onEndLesson: () => void;
}

/**
 * Main lesson screen container.
 * Displays staff notation at top, 3D keyboard in middle, stop button at bottom.
 * Note: Lesson is started by App.tsx before navigation, so no startLesson call needed here.
 */
export function LessonScreen({ onEndLesson }: LessonScreenProps) {
  const {
    currentNote,
    handleKeyClick,
    feedbackState,
    correctPitchClass,
    initializeAudio,
  } = useLessonEngine();

  const noteSelectionId = useLessonStore((state) => state.noteSelectionId);
  const [showTransition, setShowTransition] = useState(false);
  const prevSelectionIdRef = useRef(noteSelectionId);
  const audioInitialized = useRef(false);

  // Trigger page transition when a new note is selected
  useEffect(() => {
    if (noteSelectionId !== prevSelectionIdRef.current && noteSelectionId > 0) {
      prevSelectionIdRef.current = noteSelectionId;
      setShowTransition(true);
      const timer = setTimeout(() => setShowTransition(false), 300);
      return () => clearTimeout(timer);
    }
  }, [noteSelectionId]);

  // Initialize audio immediately when lesson screen mounts
  // Browser requires user gesture, so we also listen for first click as fallback
  useEffect(() => {
    if (!audioInitialized.current) {
      console.log('[LessonScreen] Mounting - attempting audio init');
      audioInitialized.current = true;
      initializeAudio().then(() => {
        console.log('[LessonScreen] Audio initialization promise resolved');
      }).catch((err) => {
        console.error('[LessonScreen] Audio initialization failed (expected if no user gesture yet):', err);
        // Reset so click handler can try again
        audioInitialized.current = false;
      });
    }
  }, [initializeAudio]);

  // Fallback: initialize on first click if mount init failed (browser autoplay policy)
  const onKeyClick = (pitchClass: PitchClass) => {
    console.log('[LessonScreen] Key clicked:', pitchClass, 'audioInitialized:', audioInitialized.current);
    if (!audioInitialized.current) {
      console.log('[LessonScreen] Initializing audio on key click');
      audioInitialized.current = true;
      initializeAudio();
    }
    handleKeyClick(pitchClass);
  };

  // Stop button handler - parent handles lesson state reset
  const handleStopLesson = () => {
    onEndLesson();
  };

  // Determine which key to highlight (blue highlight for "show answer" state)
  const highlightedKey =
    feedbackState === 'showAnswer' ? correctPitchClass : null;

  return (
    <div className="min-h-screen bg-white flex flex-col items-center py-8 px-4 relative">
      {/* Note transition overlay - white flash that fades out */}
      <div
        className={`fixed inset-0 bg-white pointer-events-none z-50 transition-opacity duration-300 ${
          showTransition ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Feedback Overlay - renders behind content via z-index */}
      <FeedbackOverlay feedbackState={feedbackState} />

      {/* Staff Display */}
      <div className="mb-4">
        <StaffDisplay noteId={currentNote} />
      </div>

      {/* 3D Piano Keyboard */}
      <div className="flex items-center justify-center mb-4">
        <PianoKeyboard3D
          onKeyClick={onKeyClick}
          highlightedKey={highlightedKey}
        />
      </div>

      {/* Stop Lesson Button */}
      <Button
        variant="secondary"
        onClick={handleStopLesson}
        className="px-6 py-3 hover:bg-red-500 hover:text-white hover:border-red-500"
      >
        Stop Lesson
      </Button>
    </div>
  );
}
