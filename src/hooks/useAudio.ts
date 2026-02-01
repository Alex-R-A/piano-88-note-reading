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
  isAudioLoading,
  disposeAudio,
} from '@/utils/audioPlayer';
import type { NoteId } from '@/types';

export interface UseAudioReturn {
  /** Whether audio samples are loaded and ready for playback */
  isReady: boolean;
  /** Whether audio is currently loading */
  isLoading: boolean;
  /** Play a note (respects audioEnabled setting) */
  playNote: (noteId: NoteId) => void;
  /** Initialize audio (call on user interaction) */
  initializeAudio: () => Promise<void>;
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
  const [isLoading, setIsLoading] = useState(isAudioLoading());

  // Track if we've attempted initialization
  const initAttemptedRef = useRef(false);

  /**
   * Initialize audio system.
   * Should be called from a user interaction event handler.
   */
  const initializeAudio = useCallback(async () => {
    if (!audioEnabled) {
      return;
    }

    if (initAttemptedRef.current && isReady) {
      // Already initialized, just resume if needed
      await resumeAudioContext();
      return;
    }

    initAttemptedRef.current = true;
    setIsLoading(true);

    try {
      await initAudio();
      await resumeAudioContext();
      setIsReady(true);
    } catch (error) {
      console.error('Audio initialization failed:', error);
      // Audio failure is non-fatal; app continues without sound
    } finally {
      setIsLoading(false);
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
    setIsLoading(isAudioLoading());
  }, []);

  // Handle audioEnabled toggle changes
  useEffect(() => {
    if (!audioEnabled) {
      // When audio is disabled, we could dispose resources
      // but for now we just stop playing (samples stay loaded for quick re-enable)
      return;
    }

    // If audio was enabled and we haven't loaded yet, initialization
    // will happen on next user interaction via initializeAudio
  }, [audioEnabled]);

  return {
    isReady,
    isLoading,
    playNote,
    initializeAudio,
  };
}

/**
 * Cleanup hook for disposing audio resources.
 * Use in App component or lesson screen cleanup.
 */
export function useAudioCleanup(): void {
  useEffect(() => {
    return () => {
      disposeAudio();
    };
  }, []);
}
