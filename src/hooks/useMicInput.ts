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

// Onset gating. Emitting a note requires a recent attack: RMS must rise
// sharply over its level ONSET_BASELINE_MS earlier, which opens a short
// emission window. Without this, any steady or slowly-decaying signal that
// clears the floor and the clarity gate kept answering questions: mains hum
// emitted continuously, and one piano strike re-emitted every ~350ms for as
// long as it rang (a ringing previous answer could answer the next question).
// The window is opened on the rising EDGE only, so one attack cannot re-open
// it after its emission, and it closes when a note is emitted.
const ONSET_RATIO = 1.5;
const ONSET_BASELINE_MS = 180;
const ONSET_WINDOW_MS = 600;
const RMS_HISTORY_MS = 400;

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
  const rmsHistoryRef = useRef<Array<{ t: number; rms: number }>>([]);
  const onsetWindowUntilRef = useRef(0);
  const onsetRisingRef = useRef(false);

  const calibrationSamplesRef = useRef<number[]>([]);
  const calibrationStartRef = useRef(0);
  const measureStartRef = useRef(0);
  const detectedHoldUntilRef = useRef(0);

  // Bumped by every cleanup(). startMic captures the value after its own
  // cleanup and compares after each await: a mismatch means the mic was
  // stopped, restarted, or unmounted while the call was suspended, and the
  // continuation must not revive it. Without this, leaving the lesson while
  // the permission prompt was open left the stream captured forever and a
  // detection loop running against an unmounted component.
  const generationRef = useRef(0);

  const onNoteDetectedRef = useRef(onNoteDetected);
  const micStateRef = useRef<MicState>('idle');

  useEffect(() => {
    onNoteDetectedRef.current = onNoteDetected;
  }, [onNoteDetected]);

  const cleanup = useCallback(() => {
    generationRef.current += 1;
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
    rmsHistoryRef.current = [];
    onsetWindowUntilRef.current = 0;
    onsetRisingRef.current = false;
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
      // Do not measure while the app is making noise of its own; the first note
      // of a lesson is played within this window.
      if (now >= suppressUntilRef.current) {
        // Time the window from the first measured frame, not from startMic.
        // Suppression routinely outlasts the nominal window (lesson start
        // suppresses for 2s), and timing from startMic ended calibration on
        // the first unsuppressed frame: a median of one sample, which a
        // single transient could set.
        if (calibrationSamplesRef.current.length === 0) {
          measureStartRef.current = now;
        }
        calibrationSamplesRef.current.push(rms);
      }
      const samples = calibrationSamplesRef.current;
      const measured =
        samples.length > 0 &&
        now - measureStartRef.current >= CALIBRATION_DURATION_MS;
      if (measured || now - calibrationStartRef.current >= CALIBRATION_TIMEOUT_MS) {
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
      const now = performance.now();

      // Onset tracking runs on every listening frame, suppressed ones
      // included: the baseline must keep following the signal so the ring of
      // the app's own playback does not read as a fresh attack the moment
      // suppression ends, and a note struck during a suppression tail still
      // opens a window that can outlive it.
      const history = rmsHistoryRef.current;
      let baseline = 0;
      for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].t <= now - ONSET_BASELINE_MS) {
          baseline = history[i].rms;
          break;
        }
      }
      history.push({ t: now, rms });
      while (history.length > 0 && history[0].t < now - RMS_HISTORY_MS) {
        history.shift();
      }
      const rising = rms >= noiseFloorRef.current && rms > baseline * ONSET_RATIO;
      if (rising && !onsetRisingRef.current) {
        onsetWindowUntilRef.current = now + ONSET_WINDOW_MS;
      }
      onsetRisingRef.current = rising;

      if (now < suppressUntilRef.current) {
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
            if (now >= onsetWindowUntilRef.current) {
              // Stable pitch with no recent attack: steady hum, or the ring
              // of a note already answered. Wait for a fresh strike.
              stabilityBufferRef.current = [];
            } else if (pitchClass === lastEmittedRef.current && now < cooldownUntilRef.current) {
              // Same note within cooldown, reset buffer to require fresh detection after cooldown
              stabilityBufferRef.current = [];
            } else {
              onNoteDetectedRef.current(pitchClass);
              lastEmittedRef.current = pitchClass;
              cooldownUntilRef.current = now + COOLDOWN_MS;
              // One emission per attack; the next needs a new onset.
              onsetWindowUntilRef.current = 0;
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
    const generation = generationRef.current;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      if (generation !== generationRef.current) {
        // The mic was stopped while the permission request was pending. The
        // stream arrived after cleanup already ran, so nothing else will ever
        // release it.
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      mediaStreamRef.current = stream;

      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      // A context created outside a user gesture starts suspended, in which
      // case the analyser only ever yields zeros and the mic reports itself as
      // listening while hearing nothing.
      if (ctx.state === 'suspended') {
        await ctx.resume();
        if (generation !== generationRef.current) {
          // cleanup ran during resume; it already stopped the stream and
          // closed the context.
          return;
        }
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
      if (generation !== generationRef.current) {
        // A newer start/stop owns the mic state; a stale failure must not
        // overwrite it with an error.
        return;
      }
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
