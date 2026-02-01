// components/LessonScreen/FeedbackOverlay.tsx
import type { FeedbackState } from '@/types';

interface FeedbackOverlayProps {
  feedbackState: FeedbackState;
}

/**
 * Full-screen overlay that flashes green (correct) or red (incorrect).
 * Uses CSS transitions for smooth fade in/out.
 *
 * Per spec lines 279-305:
 * - Correct: green #22c55e at ~30% opacity, 800ms flash, 200ms fade
 * - Incorrect: red #ef4444 at ~30% opacity, 800ms flash, 200ms fade
 * - 'showAnswer' state doesn't affect overlay (key highlighting handled by PianoKeyboard3D)
 * - Overlay sits behind content with pointer-events: none
 */
export function FeedbackOverlay({ feedbackState }: FeedbackOverlayProps) {
  // Determine background color based on feedback state
  const getBackgroundColor = (): string => {
    switch (feedbackState) {
      case 'correct':
        return 'rgba(34, 197, 94, 0.3)'; // #22c55e at 30% opacity
      case 'incorrect':
        return 'rgba(239, 68, 68, 0.3)'; // #ef4444 at 30% opacity
      case 'showAnswer':
      case 'none':
      default:
        return 'transparent';
    }
  };

  // Determine if the overlay should be visible (not fully transparent)
  const isVisible = feedbackState === 'correct' || feedbackState === 'incorrect';

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        backgroundColor: getBackgroundColor(),
        opacity: isVisible ? 1 : 0,
        transition: 'background-color 200ms ease-out, opacity 200ms ease-out',
        zIndex: 0,
      }}
      data-testid="feedback-overlay"
      aria-hidden="true"
    />
  );
}
