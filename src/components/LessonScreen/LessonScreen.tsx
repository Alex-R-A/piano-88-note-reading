// components/LessonScreen/LessonScreen.tsx
import { useEffect } from 'react';
import { StaffDisplay } from './StaffDisplay';
import { Button } from '@/components/ui';
import { useLessonEngine } from '@/hooks';

interface LessonScreenProps {
  onEndLesson: () => void;
}

/**
 * Main lesson screen container.
 * Displays staff notation at top, 3D keyboard in middle (placeholder), stop button at bottom.
 */
export function LessonScreen({ onEndLesson }: LessonScreenProps) {
  const { currentNote, isActive, startLesson, endLesson } = useLessonEngine();

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

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8 px-4">
      {/* Staff Display */}
      <div className="mb-8">
        <StaffDisplay noteId={currentNote} />
      </div>

      {/* 3D Keyboard Placeholder - Step 6 */}
      <div className="flex-1 flex items-center justify-center mb-8">
        <div
          className="bg-white rounded-lg shadow-md flex items-center justify-center text-gray-500"
          style={{ width: 600, height: 200 }}
        >
          <span className="text-lg">3D Piano Keyboard (Step 6)</span>
        </div>
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
