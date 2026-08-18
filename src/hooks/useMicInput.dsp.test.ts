// hooks/useMicInput.dsp.test.ts
// Integration tests: the real detection loop with the REAL pitchy library on
// synthesized audio (the other useMicInput tests mock the pitch detector).
// These pin the onset-gate behavior: steady hum and the ring of an already
// answered note must not keep emitting; every emission needs a fresh attack.
import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMicInput } from './useMicInput';

const SAMPLE_RATE = 48000;
const FRAME_STRIDE = 800; // ~60fps worth of new samples per rAF frame
const FRAME_MS = (FRAME_STRIDE / SAMPLE_RATE) * 1000;

let signalFn: (t: number) => number = () => 0;
let cursor = 0; // absolute sample index of the newest captured sample
let nowMs = 0;
let rafCallbacks: Array<() => void>;

class MockAnalyserNode {
  fftSize = 2048;
  getFloatTimeDomainData(buffer: Float32Array) {
    for (let i = 0; i < buffer.length; i++) {
      const sampleIndex = cursor - buffer.length + i;
      buffer[i] = sampleIndex < 0 ? 0 : signalFn(sampleIndex / SAMPLE_RATE);
    }
  }
}
class MockAudioContext {
  sampleRate = SAMPLE_RATE;
  createMediaStreamSource() {
    return { connect() {} };
  }
  createAnalyser() {
    return new MockAnalyserNode();
  }
  close() {
    return Promise.resolve();
  }
}

/** Advance simulated audio time and run one detection frame per tick. */
function tickAudio(frames: number) {
  for (let f = 0; f < frames; f++) {
    cursor += FRAME_STRIDE;
    nowMs += FRAME_MS;
    const cb = rafCallbacks.shift();
    if (cb) cb();
  }
}

describe('useMicInput with real pitchy on synthesized audio', () => {
  beforeEach(() => {
    signalFn = () => 0;
    cursor = 0;
    nowMs = 0;
    rafCallbacks = [];
    vi.spyOn(performance, 'now').mockImplementation(() => nowMs);
    vi.stubGlobal('AudioContext', MockAudioContext);
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((cb: () => void) => {
        rafCallbacks.push(cb);
        return 1;
      }),
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }],
        }),
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  async function startAndCalibrate(onNote: Mock<(pitchClass: string) => void>) {
    const { result } = renderHook(() => useMicInput(onNote));
    await act(async () => {
      await result.current.startMic();
    });
    // Silence during calibration: ~1s of frames -> quiet floor.
    act(() => tickAudio(65));
    expect(result.current.micState).toBe('listening');
    return result;
  }

  it('detects a struck A0 (27.5 Hz) end to end', async () => {
    const onNote = vi.fn();
    await startAndCalibrate(onNote);

    const t0 = cursor / SAMPLE_RATE;
    signalFn = (t) => (t < t0 ? 0 : 0.1 * Math.sin(2 * Math.PI * 27.5 * (t - t0)));
    act(() => tickAudio(15));
    expect(onNote).toHaveBeenCalledWith('A');
  });

  it('steady mains hum emits at most once (at its start), not continuously', async () => {
    // 50/60Hz hum is near-sinusoidal, so it passes the clarity gate; before
    // the onset gate it answered questions for as long as it lasted.
    const onNote = vi.fn();
    await startAndCalibrate(onNote);

    const t0 = cursor / SAMPLE_RATE;
    signalFn = (t) =>
      t < t0
        ? 0
        : 0.08 * Math.sin(2 * Math.PI * 60 * (t - t0)) +
          0.02 * Math.sin(2 * Math.PI * 120 * (t - t0));
    // ~1.3s of hum
    act(() => tickAudio(80));

    expect(onNote.mock.calls.length).toBeLessThanOrEqual(1);
  });

  it('one piano strike emits exactly once while it rings', async () => {
    // A note rings for seconds above the floor; before the onset gate it
    // re-emitted every ~350ms, letting a ringing previous answer answer the
    // next question.
    const onNote = vi.fn();
    await startAndCalibrate(onNote);

    const t0 = cursor / SAMPLE_RATE;
    signalFn = (t) =>
      t < t0 ? 0 : 0.3 * Math.exp(-(t - t0) / 1.5) * Math.sin(2 * Math.PI * 440 * (t - t0));
    // ~1.3s of ring
    act(() => tickAudio(80));

    const aCalls = onNote.mock.calls.filter((c) => c[0] === 'A').length;
    expect(aCalls).toBe(1);
  });

  it('a second strike over the ring of the first emits again', async () => {
    // The gate must not eat legitimate repeats: a fresh attack rising over
    // the decaying ring is a new answer.
    const onNote = vi.fn();
    await startAndCalibrate(onNote);

    const t0 = cursor / SAMPLE_RATE;
    const strike = (t: number) =>
      t < 0 ? 0 : 0.3 * Math.exp(-t / 1.5) * Math.sin(2 * Math.PI * 440 * t);
    signalFn = (t) => strike(t - t0) + strike(t - t0 - 0.7);

    // First strike rings alone for ~0.65s: one emission.
    act(() => tickAudio(40));
    expect(onNote.mock.calls.filter((c) => c[0] === 'A').length).toBe(1);

    // Second strike at +0.7s: a second emission, nothing more.
    act(() => tickAudio(40));
    expect(onNote.mock.calls.filter((c) => c[0] === 'A').length).toBe(2);
  });
});
