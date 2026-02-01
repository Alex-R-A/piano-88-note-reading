// components/LessonScreen/LessonScreen.tsx
import { useEffect } from 'react';
import { FeedbackOverlay } from './FeedbackOverlay';
import { StaffDisplay } from './StaffDisplay';
import { PianoKeyboard3D } from './PianoKeyboard3D';
import { Button } from '@/components/ui';
import { useLessonEngine } from '@/hooks';

interface LessonScreenProps {
  onEndLesson: () => void;
}

/**
 * Main lesson screen container.
 * Displays staff notation at top, 3D keyboard in middle, stop button at bottom.
 */
export function LessonScreen({ onEndLesson }: LessonScreenProps) {
  const {
    currentNote,
    isActive,
    startLesson,
    endLesson,
    handleKeyClick,
    feedbackState,
    correctPitchClass,
  } = useLessonEngine();

  // Start lesson when component mounts
  useEffect(() => {
    if (!isActive) {
      startLesson();
    }
  }, [isActive, startLesson]);

  const handleStopLesson = () => {
    endLesson();
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
          onKeyClick={handleKeyClick}
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
