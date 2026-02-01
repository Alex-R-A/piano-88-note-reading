// components/LessonScreen/LessonScreen.tsx
import { useEffect, useRef } from 'react';
import { FeedbackOverlay } from './FeedbackOverlay';
import { StaffDisplay } from './StaffDisplay';
import { PianoKeyboard3D } from './PianoKeyboard3D';
import { Button } from '@/components/ui';
import { useLessonEngine } from '@/hooks';
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
    isAudioReady,
  } = useLessonEngine();

  const audioInitialized = useRef(false);

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
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8 px-4 relative">
      {/* Feedback Overlay - renders behind content via z-index */}
      <FeedbackOverlay feedbackState={feedbackState} />

      {/* Staff Display */}
      <div className="mb-8">
        <StaffDisplay noteId={currentNote} />
      </div>

      {/* 3D Piano Keyboard */}
      <div className="flex-1 flex items-center justify-center mb-8">
        <PianoKeyboard3D
          onKeyClick={onKeyClick}
          highlightedKey={highlightedKey}
        />
      </div>

      {/* Stop Lesson Button */}
      <Button
        variant="secondary"
        onClick={handleStopLesson}
        className="px-6 py-3"
      >
        Stop Lesson
      </Button>
    </div>
  );
}
