import { useState, useRef, useEffect, useCallback } from 'react';
import { PitchDetector } from 'pitchy';
import type { PitchClass } from '@/types';

type MicState = 'idle' | 'calibrating' | 'listening' | 'error';

interface UseMicInputReturn {
  micState: MicState;
  errorMessage: string | null;
  detectedPitch: PitchClass | null;
  startMic: () => Promise<void>;
  stopMic: () => void;
  suppressDetection: (durationMs: number) => void;
}

const CLARITY_THRESHOLD = 0.9;
const CONSECUTIVE_FRAMES_REQUIRED = 3;
const COOLDOWN_MS = 300;

// The analysis window is the whole FFT size, and pitch detection needs roughly
// two periods of the fundamental. 4096 samples is ~85ms at 48kHz, which covers
// A0 at 27.5Hz (a 36ms period). At 2048 the window bottoms out around 60Hz and
// the lowest octave of the keyboard cannot be detected at all.
const ANALYSER_FFT_SIZE = 4096;

const CALIBRATION_DURATION_MS = 1000;
// Suppression can outlast the calibration window, so allow calibration to run
// long rather than measuring nothing.
const CALIBRATION_TIMEOUT_MS = 4000;

const NOISE_FLOOR_MULTIPLIER = 2.5;
const NOISE_FLOOR_MIN = 0.004;
// Hard ceiling. Calibration measures whatever is audible, so a sustained sound
// during the window (a fan, a voice, the app's own playback, the user testing
// a note) would otherwise set a floor no real playing could cross, leaving the
// mic permanently deaf while still reporting itself as active. Note onsets
// measure well above this, and the clarity gate is what actually rejects noise.
const NOISE_FLOOR_MAX = 0.02;

// How long a detected pitch stays on screen. Detection emits a note, which
// starts feedback, which suppresses detection, which cleared the readout on the
// very next frame -- so it never survived to paint. Holding it briefly is what
// makes the indicator visible at all.
const DETECTED_PITCH_HOLD_MS = 900;

const NOTE_NAMES: PitchClass[] = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
];

function frequencyToPitchClass(hz: number): PitchClass | null {
  if (!Number.isFinite(hz) || hz <= 0) return null;
  const midi = Math.round(12 * Math.log2(hz / 440) + 69);
  return NOTE_NAMES[((midi % 12) + 12) % 12];
}

function calculateRMS(buffer: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    sum += buffer[i] * buffer[i];
  }
  return Math.sqrt(sum / buffer.length);
}

/** Median rather than mean: one loud frame should not move the estimate. */
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

export function useMicInput(
  onNoteDetected: (pitchClass: PitchClass) => void,
): UseMicInputReturn {
  const [micState, setMicState] = useState<MicState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [detectedPitch, setDetectedPitch] = useState<PitchClass | null>(null);
  const lastDetectedPitchRef = useRef<PitchClass | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const detectorRef = useRef<PitchDetector<Float32Array> | null>(null);
  const bufferRef = useRef<Float32Array<ArrayBuffer> | null>(null);

  const noiseFloorRef = useRef(0);
  const stabilityBufferRef = useRef<PitchClass[]>([]);
  const lastEmittedRef = useRef<PitchClass | null>(null);
  const cooldownUntilRef = useRef(0);
  const suppressUntilRef = useRef(0);

  const calibrationSamplesRef = useRef<number[]>([]);
  const calibrationStartRef = useRef(0);
  const detectedHoldUntilRef = useRef(0);

  const onNoteDetectedRef = useRef(onNoteDetected);
  const micStateRef = useRef<MicState>('idle');

  useEffect(() => {
    onNoteDetectedRef.current = onNoteDetected;
  }, [onNoteDetected]);

  const cleanup = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    detectorRef.current = null;
    bufferRef.current = null;
    stabilityBufferRef.current = [];
    lastEmittedRef.current = null;
    lastDetectedPitchRef.current = null;
    cooldownUntilRef.current = 0;
    calibrationSamplesRef.current = [];
    suppressUntilRef.current = 0;
    detectedHoldUntilRef.current = 0;
  }, []);

  const detectionLoop = useCallback(() => {
    const analyser = analyserRef.current;
    const detector = detectorRef.current;
    const buffer = bufferRef.current;
    const ctx = audioContextRef.current;

    if (!analyser || !detector || !buffer || !ctx) return;

    const clearDetectedPitchAfterHold = () => {
      if (
        lastDetectedPitchRef.current !== null &&
        performance.now() >= detectedHoldUntilRef.current
      ) {
        lastDetectedPitchRef.current = null;
        setDetectedPitch(null);
      }
    };

    analyser.getFloatTimeDomainData(buffer);
    const rms = calculateRMS(buffer);

    if (micStateRef.current === 'calibrating') {
      const now = performance.now();
      const elapsed = now - calibrationStartRef.current;
      // Do not measure while the app is making noise of its own; the first note
      // of a lesson is played within this window.
      if (now >= suppressUntilRef.current) {
        calibrationSamplesRef.current.push(rms);
      }
      const samples = calibrationSamplesRef.current;
      const measured = elapsed >= CALIBRATION_DURATION_MS && samples.length > 0;
      if (measured || elapsed >= CALIBRATION_TIMEOUT_MS) {
        noiseFloorRef.current = samples.length
          ? Math.min(
              Math.max(median(samples) * NOISE_FLOOR_MULTIPLIER, NOISE_FLOOR_MIN),
              NOISE_FLOOR_MAX
            )
          : NOISE_FLOOR_MIN;
        micStateRef.current = 'listening';
        setMicState('listening');
      }
    } else if (micStateRef.current === 'listening') {
      if (performance.now() < suppressUntilRef.current) {
        stabilityBufferRef.current = [];
        clearDetectedPitchAfterHold();
        rafIdRef.current = requestAnimationFrame(detectionLoop);
        return;
      }
      if (rms < noiseFloorRef.current) {
        stabilityBufferRef.current = [];
        clearDetectedPitchAfterHold();
      } else {
        const [freq, clarity] = detector.findPitch(buffer, ctx.sampleRate);
        if (clarity < CLARITY_THRESHOLD) {
          stabilityBufferRef.current = [];
          clearDetectedPitchAfterHold();
        } else {
          const pitchClass = frequencyToPitchClass(freq);
          if (pitchClass === null) {
            stabilityBufferRef.current = [];
            rafIdRef.current = requestAnimationFrame(detectionLoop);
            return;
          }
          detectedHoldUntilRef.current =
            performance.now() + DETECTED_PITCH_HOLD_MS;
          if (lastDetectedPitchRef.current !== pitchClass) {
            lastDetectedPitchRef.current = pitchClass;
            setDetectedPitch(pitchClass);
          }
          const sb = stabilityBufferRef.current;
          sb.push(pitchClass);
          if (sb.length > CONSECUTIVE_FRAMES_REQUIRED) {
            sb.shift();
          }
          if (sb.length === CONSECUTIVE_FRAMES_REQUIRED && sb.every((n) => n === sb[0])) {
            const now = performance.now();
            if (pitchClass === lastEmittedRef.current && now < cooldownUntilRef.current) {
              // Same note within cooldown, reset buffer to require fresh detection after cooldown
              stabilityBufferRef.current = [];
            } else {
              onNoteDetectedRef.current(pitchClass);
              lastEmittedRef.current = pitchClass;
              cooldownUntilRef.current = now + COOLDOWN_MS;
              stabilityBufferRef.current = [];
            }
          }
        }
      }
    }

    rafIdRef.current = requestAnimationFrame(detectionLoop);
  }, []);

  const startMic = useCallback(async () => {
    cleanup();
    setErrorMessage(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      mediaStreamRef.current = stream;

      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      // A context created outside a user gesture starts suspended, in which
      // case the analyser only ever yields zeros and the mic reports itself as
      // listening while hearing nothing.
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = ANALYSER_FFT_SIZE;
      source.connect(analyser);
      analyserRef.current = analyser;

      // frequencyBinCount is half of fftSize. Sizing the time-domain buffer off
      // it threw away half the analysis window.
      const windowSize = analyser.fftSize;
      const detector = PitchDetector.forFloat32Array(windowSize);
      detectorRef.current = detector;
      bufferRef.current = new Float32Array(windowSize);

      calibrationSamplesRef.current = [];
      calibrationStartRef.current = performance.now();
      noiseFloorRef.current = 0;
      stabilityBufferRef.current = [];
      lastEmittedRef.current = null;
      cooldownUntilRef.current = 0;

      micStateRef.current = 'calibrating';
      setMicState('calibrating');

      rafIdRef.current = requestAnimationFrame(detectionLoop);
    } catch (err) {
      cleanup();
      micStateRef.current = 'error';
      setMicState('error');

      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setErrorMessage('Microphone access denied. Check browser permissions.');
      } else if (err instanceof DOMException && err.name === 'NotFoundError') {
        setErrorMessage('No microphone found.');
      } else {
        setErrorMessage('Failed to start microphone.');
      }
    }
  }, [cleanup, detectionLoop]);

  const suppressDetection = useCallback((durationMs: number) => {
    suppressUntilRef.current = performance.now() + durationMs;
    stabilityBufferRef.current = [];
  }, []);

  const stopMic = useCallback(() => {
    cleanup();
    detectedHoldUntilRef.current = 0;
    micStateRef.current = 'idle';
    setMicState('idle');
    setErrorMessage(null);
    setDetectedPitch(null);
  }, [cleanup]);

  useEffect(() => () => cleanup(), [cleanup]);

  return { micState, errorMessage, detectedPitch, startMic, stopMic, suppressDetection };
}
