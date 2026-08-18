// components/LessonScreen/LessonScreen.tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { FeedbackOverlay } from './FeedbackOverlay';
import { StaffDisplay } from './StaffDisplay';
import { PianoKeyboard3D } from './PianoKeyboard3D';
import { Button } from '@/components/ui';
import { useLessonEngine, useMicInput } from '@/hooks';
import type { AudioStatus } from '@/hooks/useAudio';
import { useLessonStore } from '@/stores/lessonStore';
import { useSettingsStore } from '@/stores/settingsStore';
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
  const showStaffDisplay = useSettingsStore((state) => state.showStaffDisplay);
  const micEnabled = useSettingsStore((state) => state.micEnabled);
  const audioEnabled = useSettingsStore((state) => state.audioEnabled);

  const { micState, errorMessage: micError, detectedPitch, startMic, stopMic, suppressDetection } = useMicInput(handleKeyClick);

  useEffect(() => {
    if (micEnabled && micState === 'idle') {
      startMic();
    } else if (!micEnabled && micState !== 'idle') {
      stopMic();
    }
  }, [micEnabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // Suppress mic detection during feedback audio playback (correct/incorrect answer sounds)
  useEffect(() => {
    if (feedbackState === 'correct' || feedbackState === 'incorrect') {
      suppressDetection(1500);
    }
  }, [feedbackState, suppressDetection]);

  const [showTransition, setShowTransition] = useState(false);
  const [audioStatus, setAudioStatus] = useState<AudioStatus>('ok');
  const prevSelectionIdRef = useRef(noteSelectionId);
  const audioInitialized = useRef(false);

  // Trigger page transition when a new note is selected
  // Uses a key-based approach: increment key to remount the overlay with fresh animation
  // Also suppress mic detection to avoid picking up the played sample audio
  useEffect(() => {
    if (noteSelectionId !== prevSelectionIdRef.current && noteSelectionId > 0) {
      prevSelectionIdRef.current = noteSelectionId;
      setShowTransition(true);
      suppressDetection(2000);
      const timer = setTimeout(() => setShowTransition(false), 400);
      return () => clearTimeout(timer);
    }
  }, [noteSelectionId, suppressDetection]);

  // The lesson is started by App.tsx before this screen mounts, so the first
  // note's selection id is already current and the effect above never fires for
  // it. Without this the opening note plays through the speakers with the mic
  // wide open, letting the app answer its own question and contaminating the
  // noise-floor calibration.
  useEffect(() => {
    suppressDetection(2000);
  }, [suppressDetection]);

  // Attempt audio init and record the outcome so failures are visible
  // (spec error handling: "Audio was blocked" / "Audio unavailable").
  // A non-ok outcome re-arms the flag so any later user gesture retries.
  const tryInitAudio = useCallback(() => {
    if (audioInitialized.current) return;
    audioInitialized.current = true;
    initializeAudio().then((status) => {
      setAudioStatus(status);
      if (status !== 'ok') {
        audioInitialized.current = false;
      }
    });
  }, [initializeAudio]);

  // Initialize audio immediately when lesson screen mounts
  // Browser requires user gesture, so clicks also retry via tryInitAudio
  useEffect(() => {
    tryInitAudio();
  }, [tryInitAudio]);

  // Fallback: initialize on first click if mount init failed (browser autoplay policy)
  const onKeyClick = (pitchClass: PitchClass) => {
    tryInitAudio();
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
    // The click handler implements the spec's "Click anywhere to enable
    // sound" recovery for a blocked or failed audio context.
    <div
      className="surface-paper min-h-screen flex flex-col items-center py-8 px-4 relative"
      onClick={audioStatus !== 'ok' ? tryInitAudio : undefined}
    >
      {/* Note transition overlay - white flash that fades out */}
      {showTransition && (
        <div
          key={noteSelectionId}
          // Matches the page ground: a pure white flash reads as a strobe
          // against the paper background rather than a page turn.
          className="fixed inset-0 bg-ivory pointer-events-none z-50"
          style={{
            animation: 'fadeOut 400ms ease-out forwards',
          }}
        />
      )}

      {/* Feedback Overlay - renders behind content via z-index */}
      <FeedbackOverlay feedbackState={feedbackState} />

      {/* Staff Display - hidden for audio-only mode */}
      {showStaffDisplay && (
        <div className="mb-4">
          <StaffDisplay noteId={currentNote} />
        </div>
      )}

      {/* 3D Piano Keyboard. The canvas is transparent and the instrument casts
          no shadow outside its own geometry, so a soft ground sits behind it to
          keep it from floating on a blank field. */}
      <div className="keyboard-ground flex items-center justify-center mb-4">
        <PianoKeyboard3D
          onKeyClick={onKeyClick}
          highlightedKey={highlightedKey}
        />
      </div>

      {/* Audio trouble notices (spec error handling) */}
      {audioEnabled && audioStatus === 'blocked' && (
        <div
          className="text-xs uppercase tracking-[0.18em] text-brass-700 text-center mb-3"
          data-testid="audio-blocked-notice"
        >
          Audio was blocked. Click anywhere to enable sound.
        </div>
      )}
      {audioEnabled && audioStatus === 'unavailable' && (
        <div
          className="text-xs uppercase tracking-[0.18em] text-felt-600 text-center mb-3"
          data-testid="audio-unavailable-notice"
        >
          Audio unavailable
        </div>
      )}

      {/* Mic Status Indicator */}
      {micEnabled && (
        <div className="text-xs uppercase tracking-[0.18em] text-center mb-3">
          {micState === 'calibrating' && <span className="text-brass-700">Calibrating mic...</span>}
          {micState === 'listening' && (
            <span className="text-emerald-700">
              Mic active{detectedPitch && <span className="text-ink-500"> &middot; {detectedPitch}</span>}
            </span>
          )}
          {micState === 'error' && <span className="text-felt-600">{micError}</span>}
        </div>
      )}

      {/* Stop Lesson Button */}
      <Button
        variant="secondary"
        onClick={handleStopLesson}
        className="px-8 text-sm uppercase tracking-[0.18em] hover:bg-felt-700 hover:text-ivory-50 hover:ring-felt-700"
      >
        Stop Lesson
      </Button>
    </div>
  );
}
