import { useState, useRef, useEffect, useCallback } from 'react';
import { PitchDetector } from 'pitchy';
import type { PitchClass } from '@/types';

export type MicState = 'idle' | 'calibrating' | 'listening' | 'error';

export interface UseMicInputReturn {
  micState: MicState;
  errorMessage: string | null;
  startMic: () => Promise<void>;
  stopMic: () => void;
  suppressDetection: (durationMs: number) => void;
}

const CLARITY_THRESHOLD = 0.9;
const CONSECUTIVE_FRAMES_REQUIRED = 3;
const COOLDOWN_MS = 300;
const ANALYSER_FFT_SIZE = 2048;
const CALIBRATION_DURATION_MS = 1000;
const NOISE_FLOOR_MULTIPLIER = 3;
const NOISE_FLOOR_MIN = 0.005;

const NOTE_NAMES: PitchClass[] = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
];

function frequencyToPitchClass(hz: number): PitchClass {
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

export function useMicInput(
  onNoteDetected: (pitchClass: PitchClass) => void,
): UseMicInputReturn {
  const [micState, setMicState] = useState<MicState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const detectorRef = useRef<PitchDetector<Float32Array> | null>(null);
  const bufferRef = useRef<Float32Array | null>(null);

  const noiseFloorRef = useRef(0);
  const stabilityBufferRef = useRef<PitchClass[]>([]);
  const lastEmittedRef = useRef<PitchClass | null>(null);
  const cooldownUntilRef = useRef(0);
  const suppressUntilRef = useRef(0);

  const calibrationSamplesRef = useRef<number[]>([]);
  const calibrationStartRef = useRef(0);

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
    cooldownUntilRef.current = 0;
    calibrationSamplesRef.current = [];
    suppressUntilRef.current = 0;
  }, []);

  const detectionLoop = useCallback(() => {
    const analyser = analyserRef.current;
    const detector = detectorRef.current;
    const buffer = bufferRef.current;
    const ctx = audioContextRef.current;

    if (!analyser || !detector || !buffer || !ctx) return;

    analyser.getFloatTimeDomainData(buffer);
    const rms = calculateRMS(buffer);

    if (micStateRef.current === 'calibrating') {
      calibrationSamplesRef.current.push(rms);
      const elapsed = performance.now() - calibrationStartRef.current;
      if (elapsed >= CALIBRATION_DURATION_MS) {
        const samples = calibrationSamplesRef.current;
        const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
        noiseFloorRef.current = Math.max(mean * NOISE_FLOOR_MULTIPLIER, NOISE_FLOOR_MIN);
        micStateRef.current = 'listening';
        setMicState('listening');
      }
    } else if (micStateRef.current === 'listening') {
      if (performance.now() < suppressUntilRef.current) {
        stabilityBufferRef.current = [];
        rafIdRef.current = requestAnimationFrame(detectionLoop);
        return;
      }
      if (rms < noiseFloorRef.current) {
        stabilityBufferRef.current = [];
      } else {
        const [freq, clarity] = detector.findPitch(buffer, ctx.sampleRate);
        if (clarity < CLARITY_THRESHOLD) {
          stabilityBufferRef.current = [];
        } else {
          const pitchClass = frequencyToPitchClass(freq);
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

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = ANALYSER_FFT_SIZE;
      source.connect(analyser);
      analyserRef.current = analyser;

      const detector = PitchDetector.forFloat32Array(analyser.frequencyBinCount);
      detectorRef.current = detector;
      bufferRef.current = new Float32Array(analyser.frequencyBinCount);

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
    micStateRef.current = 'idle';
    setMicState('idle');
    setErrorMessage(null);
  }, [cleanup]);

  useEffect(() => () => cleanup(), [cleanup]);

  return { micState, errorMessage, startMic, stopMic, suppressDetection };
}
