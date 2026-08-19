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
  const fullNoteSet = useLessonStore((state) => state.fullNoteSet);
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

  const [audioStatus, setAudioStatus] = useState<AudioStatus>('ok');
  const prevSelectionIdRef = useRef(noteSelectionId);
  const audioInitialized = useRef(false);

  // The keyboard accepts presses only while a question is fully on screen:
  // not during answer feedback, and not until the new note's 320ms fade-in
  // has finished. Locking also resets any key still held down, so the board
  // is visually fresh when the next question arrives.
  const [noteSettled, setNoteSettled] = useState(false);
  useEffect(() => {
    setNoteSettled(false);
    const timer = setTimeout(() => setNoteSettled(true), 350);
    return () => clearTimeout(timer);
  }, [noteSelectionId]);
  const keysInteractive =
    feedbackState === 'none' && currentNote !== null && noteSettled;

  // Suppress mic detection on each new note to avoid picking up the played
  // sample audio. The note's visual entrance is handled inside the staff
  // itself (useVexFlow fades the new note in); the staff lines and clef stay
  // put.
  useEffect(() => {
    if (noteSelectionId !== prevSelectionIdRef.current && noteSelectionId > 0) {
      prevSelectionIdRef.current = noteSelectionId;
      suppressDetection(2000);
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
  // A non-ok outcome re-arms the flag so a later user gesture retries, but
  // no more than once every few seconds: sample loading opens a context and
  // fires a burst of fetches, which must not happen on every key click while
  // the network is down.
  // -Infinity, not 0: performance.now() is ms since page load, so a 0
  // sentinel would silently skip the first attempt for any lesson entered
  // within 3s of loading the app.
  const lastInitAttemptRef = useRef(-Infinity);
  const tryInitAudio = useCallback(() => {
    if (audioInitialized.current) return;
    if (performance.now() - lastInitAttemptRef.current < 3000) return;
    lastInitAttemptRef.current = performance.now();
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
      {/* Feedback Overlay - renders behind content via z-index */}
      <FeedbackOverlay feedbackState={feedbackState} />

      {/* Staff Display - hidden for audio-only mode */}
      {showStaffDisplay && (
        <div className="mb-4">
          <StaffDisplay noteId={currentNote} noteSet={fullNoteSet} />
        </div>
      )}

      {/* 3D Piano Keyboard. The canvas is transparent and the instrument casts
          no shadow outside its own geometry, so a soft ground sits behind it to
          keep it from floating on a blank field. */}
      <div className="keyboard-ground flex items-center justify-center mb-4">
        <PianoKeyboard3D
          onKeyClick={onKeyClick}
          highlightedKey={highlightedKey}
          interactive={keysInteractive}
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
        className="px-8 text-sm uppercase tracking-[0.18em]"
      >
        Stop Lesson
      </Button>
    </div>
  );
}
