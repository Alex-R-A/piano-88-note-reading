// hooks/useAudio.ts
// React hook wrapping audioPlayer for component usage.
// Handles initialization on first user interaction and respects audioEnabled setting.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import {
  initAudio,
  playNote as playNoteRaw,
  resumeAudioContext,
  isAudioReady,
} from '@/utils/audioPlayer';
import type { NoteId } from '@/types';

/**
 * Outcome of an audio initialization attempt, per spec error handling:
 * 'blocked' = context suspended by autoplay policy (needs a user gesture),
 * 'unavailable' = samples failed to load.
 */
export type AudioStatus = 'ok' | 'blocked' | 'unavailable';

interface UseAudioReturn {
  /** Whether audio samples are loaded and ready for playback */
  isReady: boolean;
  /** Play a note (respects audioEnabled setting) */
  playNote: (noteId: NoteId) => void;
  /** Initialize audio (call on user interaction) */
  initializeAudio: () => Promise<AudioStatus>;
}

/**
 * Hook for audio playback in the piano learning app.
 *
 * - Initializes audio on first user interaction if audioEnabled is true
 * - Exposes playNote function that respects audioEnabled setting
 * - Handles AudioContext resume for browser autoplay policies
 */
export function useAudio(): UseAudioReturn {
  const { audioEnabled } = useSettingsStore();

  const [isReady, setIsReady] = useState(isAudioReady());

  // Track if we've attempted initialization
  const initAttemptedRef = useRef(false);

  /**
   * Initialize audio system.
   * Should be called from a user interaction event handler.
   */
  const initializeAudio = useCallback(async (): Promise<AudioStatus> => {
    if (!audioEnabled) {
      return 'ok';
    }

    if (initAttemptedRef.current && isReady) {
      // Already initialized, just resume if needed
      return (await resumeAudioContext()) ? 'ok' : 'blocked';
    }

    initAttemptedRef.current = true;

    try {
      await initAudio();
      const resumed = await resumeAudioContext();
      setIsReady(true);
      // A suspended context plays nothing even with samples loaded; callers
      // surface this so a later user gesture can retry the resume.
      return resumed ? 'ok' : 'blocked';
    } catch (error) {
      console.error('Audio initialization failed:', error);
      // Audio failure is non-fatal; app continues without sound
      return 'unavailable';
    }
  }, [audioEnabled, isReady]);

  /**
   * Play a note if audio is enabled and ready.
   */
  const playNote = useCallback(
    (noteId: NoteId) => {
      if (!audioEnabled || !isReady) {
        return;
      }

      playNoteRaw(noteId);
    },
    [audioEnabled, isReady]
  );

  // Sync state with audioPlayer module state
  useEffect(() => {
    setIsReady(isAudioReady());
  }, []);


  return {
    isReady,
    playNote,
    initializeAudio,
  };
}

