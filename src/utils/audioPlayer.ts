// utils/audioPlayer.ts
// Audio playback utility using smplr's SplendidGrandPiano.
// Lazy-loads samples on first use and handles AudioContext autoplay policy.

import { SplendidGrandPiano } from 'smplr';
import type { NoteId } from '@/types';

let audioContext: AudioContext | null = null;
let piano: SplendidGrandPiano | null = null;
let isLoading = false;
let isLoaded = false;
let loadPromise: Promise<void> | null = null;

/**
 * Converts NoteId format to smplr-compatible format.
 * smplr accepts note names like "C4", "Db4", "C#4" directly.
 * Our NoteId format is the same, so minimal conversion needed.
 *
 * @param noteId - Note in format like "C#4", "Bb3", "G5"
 * @returns smplr-compatible note string
 */
export function convertToSmplrFormat(noteId: NoteId): string {
  // smplr accepts both "C#4" and "Db4" formats directly
  // Our NoteId format matches smplr's expected format
  return noteId;
}

/**
 * Initialize the audio system.
 * Creates AudioContext and loads SplendidGrandPiano samples.
 * Safe to call multiple times; will return existing promise if already loading.
 *
 * IMPORTANT: AudioContext may be suspended due to browser autoplay policies.
 * Call resumeAudioContext() after a user gesture to ensure playback works.
 */
export async function initAudio(): Promise<void> {
  console.log('[Audio] initAudio called, isLoaded:', isLoaded, 'isLoading:', isLoading);

  // Return existing promise if already loading
  if (loadPromise) {
    console.log('[Audio] Already loading, returning existing promise');
    return loadPromise;
  }

  // Already loaded
  if (isLoaded && piano) {
    console.log('[Audio] Already loaded, returning');
    return Promise.resolve();
  }

  isLoading = true;
  console.log('[Audio] Starting initialization...');

  loadPromise = (async () => {
    try {
      // Create AudioContext (may be suspended until user gesture)
      audioContext = new AudioContext();
      console.log('[Audio] AudioContext created, state:', audioContext.state);

      // Create piano instrument and wait for samples to load
      piano = new SplendidGrandPiano(audioContext);
      console.log('[Audio] Loading piano samples...');
      await piano.load;
      console.log('[Audio] Piano samples loaded!');

      isLoaded = true;
      console.log('[Audio] Initialization complete, isLoaded:', isLoaded);
    } catch (error) {
      // Reset state on failure so retry is possible
      audioContext = null;
      piano = null;
      loadPromise = null;
      isLoaded = false;
      console.error('[Audio] Failed to initialize:', error);
      throw error;
    } finally {
      isLoading = false;
    }
  })();

  return loadPromise;
}

/**
 * Resume AudioContext if suspended.
 * Call this after a user interaction (click, keypress) to handle autoplay policies.
 * Returns true if context is running, false if resume failed or no context exists.
 */
export async function resumeAudioContext(): Promise<boolean> {
  console.log('[Audio] resumeAudioContext called, audioContext:', !!audioContext);
  if (!audioContext) {
    console.log('[Audio] No audioContext to resume');
    return false;
  }

  const state = audioContext.state;
  console.log('[Audio] AudioContext state:', state);
  if (state === 'suspended') {
    try {
      await audioContext.resume();
      console.log('[Audio] AudioContext resumed, new state:', audioContext.state);
      return audioContext.state === 'running';
    } catch (error) {
      console.error('[Audio] Failed to resume AudioContext:', error);
      return false;
    }
  }

  return state === 'running';
}

/**
 * Play a note on the piano.
 * Note will only play if audio is initialized and ready.
 *
 * @param noteId - Note to play in format like "C#4", "Bb3", "G5"
 */
export function playNote(noteId: NoteId): void {
  console.log('[Audio] playNote called:', noteId, 'piano:', !!piano, 'isLoaded:', isLoaded);
  if (!piano || !isLoaded) {
    console.log('[Audio] Cannot play - piano not ready');
    return;
  }

  const smplrNote = convertToSmplrFormat(noteId);
  console.log('[Audio] Playing note:', smplrNote);

  try {
    // Start the note with short duration (0.5 seconds)
    piano.start({ note: smplrNote, duration: 0.5 });
    console.log('[Audio] Note started successfully');
  } catch (error) {
    console.error('[Audio] Failed to play note:', noteId, error);
  }
}

/**
 * Check if audio is initialized and ready for playback.
 */
export function isAudioReady(): boolean {
  return isLoaded && piano !== null;
}

/**
 * Check if audio is currently loading.
 */
export function isAudioLoading(): boolean {
  return isLoading;
}

/**
 * Get the current AudioContext state.
 * Returns 'suspended', 'running', 'closed', or null if no context exists.
 */
export function getAudioContextState(): AudioContextState | null {
  return audioContext?.state ?? null;
}

/**
 * Clean up audio resources.
 * Call this when audio is no longer needed (e.g., when disabling audio).
 */
export async function disposeAudio(): Promise<void> {
  if (piano) {
    // Stop any playing notes
    piano.stop();
    piano = null;
  }

  if (audioContext) {
    try {
      await audioContext.close();
    } catch (error) {
      console.error('Failed to close AudioContext:', error);
    }
    audioContext = null;
  }

  isLoaded = false;
  isLoading = false;
  loadPromise = null;
}
