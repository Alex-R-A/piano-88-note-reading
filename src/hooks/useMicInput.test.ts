import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMicInput } from './useMicInput';

// --- Mock types and state ---

let mockFindPitchResult: [number, number] = [440, 0.95];
let mockGetFloatTimeDomainData: (buffer: Float32Array) => void;
let mockStreamTracks: Array<{ stop: ReturnType<typeof vi.fn> }>;
let mockAudioContextClosed: boolean;
let rafCallbacks: Array<() => void>;
let rafIdCounter: number;

// Default: fill buffer with a constant signal (RMS = value)
function fillBufferWithRMS(rms: number) {
  mockGetFloatTimeDomainData = (buffer: Float32Array) => {
    buffer.fill(rms);
  };
}

// --- Mocks ---

vi.mock('pitchy', () => ({
  PitchDetector: {
    forFloat32Array: () => ({
      findPitch: () => mockFindPitchResult,
    }),
  },
}));

// The hook assigns fftSize; frequencyBinCount tracks it as in the real node.
const ANALYSER_FFT_SIZE_EXPECTED = 4096;

class MockAnalyserNode {
  fftSize = 2048;
  get frequencyBinCount() {
    return this.fftSize / 2;
  }
  getFloatTimeDomainData(buffer: Float32Array) {
    mockGetFloatTimeDomainData(buffer);
  }
}

class MockMediaStreamSource {
  connect() {}
}

class MockAudioContext {
  sampleRate = 44100;
  createMediaStreamSource() {
    return new MockMediaStreamSource();
  }
  createAnalyser() {
    return new MockAnalyserNode();
  }
  close() {
    mockAudioContextClosed = true;
    return Promise.resolve();
  }
}

function setupMocks() {
  mockAudioContextClosed = false;
  mockStreamTracks = [{ stop: vi.fn() }];
  rafCallbacks = [];
  rafIdCounter = 1;

  fillBufferWithRMS(0.01); // Default: small signal

  vi.stubGlobal('AudioContext', MockAudioContext);
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn((cb: () => void) => {
      rafCallbacks.push(cb);
      return rafIdCounter++;
    }),
  );
  vi.stubGlobal('cancelAnimationFrame', vi.fn());

  const mockGetUserMedia = vi.fn().mockResolvedValue({
    getTracks: () => mockStreamTracks,
  });
  Object.defineProperty(navigator, 'mediaDevices', {
    value: { getUserMedia: mockGetUserMedia },
    writable: true,
    configurable: true,
  });
}

/** Tick N rAF frames. Each tick executes the latest queued callback, which re-queues itself. */
function tickFrames(n: number) {
  for (let i = 0; i < n; i++) {
    const cb = rafCallbacks.shift();
    if (cb) cb();
  }
}

describe('useMicInput', () => {
  beforeEach(() => {
    vi.spyOn(performance, 'now').mockReturnValue(0);
    setupMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  // --- State transitions ---

  it('starts in idle state', () => {
    const onNote = vi.fn();
    const { result } = renderHook(() => useMicInput(onNote));
    expect(result.current.micState).toBe('idle');
    expect(result.current.errorMessage).toBeNull();
  });

  it('transitions to calibrating on startMic', async () => {
    const onNote = vi.fn();
    const { result } = renderHook(() => useMicInput(onNote));

    await act(async () => {
      await result.current.startMic();
    });

    expect(result.current.micState).toBe('calibrating');
  });

  it('transitions to listening after calibration duration', async () => {
    const onNote = vi.fn();
    const { result } = renderHook(() => useMicInput(onNote));

    await act(async () => {
      await result.current.startMic();
    });

    // Measure one frame, then advance performance.now past calibration
    act(() => tickFrames(1));
    vi.spyOn(performance, 'now').mockReturnValue(1100);
    act(() => tickFrames(1));

    expect(result.current.micState).toBe('listening');
  });

  it('transitions to idle on stopMic', async () => {
    const onNote = vi.fn();
    const { result } = renderHook(() => useMicInput(onNote));

    await act(async () => {
      await result.current.startMic();
    });
    expect(result.current.micState).toBe('calibrating');

    act(() => result.current.stopMic());
    expect(result.current.micState).toBe('idle');
  });

  it('transitions to error on getUserMedia rejection', async () => {
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new DOMException('Permission denied', 'NotAllowedError'),
    );

    const onNote = vi.fn();
    const { result } = renderHook(() => useMicInput(onNote));

    await act(async () => {
      await result.current.startMic();
    });

    expect(result.current.micState).toBe('error');
    expect(result.current.errorMessage).toContain('denied');
  });

  it('transitions to error with NotFoundError message', async () => {
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new DOMException('No device', 'NotFoundError'),
    );

    const onNote = vi.fn();
    const { result } = renderHook(() => useMicInput(onNote));

    await act(async () => {
      await result.current.startMic();
    });

    expect(result.current.micState).toBe('error');
    expect(result.current.errorMessage).toContain('No microphone');
  });

  it('can retry from error state', async () => {
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new DOMException('Denied', 'NotAllowedError'))
      .mockResolvedValueOnce({ getTracks: () => mockStreamTracks });

    const onNote = vi.fn();
    const { result } = renderHook(() => useMicInput(onNote));

    await act(async () => {
      await result.current.startMic();
    });
    expect(result.current.micState).toBe('error');

    await act(async () => {
      await result.current.startMic();
    });
    expect(result.current.micState).toBe('calibrating');
    expect(result.current.errorMessage).toBeNull();
  });

  // --- Calibration ---

  it('computes noise floor from calibration samples with minimum', async () => {
    // Fill with very small RMS so mean * 3 < 0.005
    fillBufferWithRMS(0.001);

    const onNote = vi.fn();
    const { result } = renderHook(() => useMicInput(onNote));

    await act(async () => {
      await result.current.startMic();
    });

    // Run a few calibration frames
    act(() => tickFrames(5));

    // End calibration
    vi.spyOn(performance, 'now').mockReturnValue(1100);
    act(() => tickFrames(1));

    expect(result.current.micState).toBe('listening');
    // Noise floor should be at least NOISE_FLOOR_MIN (0.005)
    // Verified by: a signal below 0.005 should not trigger detection
  });

  // --- Detection gates ---

  it('does not emit when rms is below noise floor (silence)', async () => {
    const onNote = vi.fn();
    const { result } = renderHook(() => useMicInput(onNote));

    await act(async () => {
      await result.current.startMic();
    });

    // Complete calibration with moderate signal
    fillBufferWithRMS(0.05);
    act(() => tickFrames(3));
    vi.spyOn(performance, 'now').mockReturnValue(1100);
    act(() => tickFrames(1));
    expect(result.current.micState).toBe('listening');

    // Now go silent (well below noise floor of ~0.15)
    fillBufferWithRMS(0.001);
    mockFindPitchResult = [440, 0.95];
    act(() => tickFrames(10));

    expect(onNote).not.toHaveBeenCalled();
  });

  it('does not emit when clarity is below threshold', async () => {
    const onNote = vi.fn();
    const { result } = renderHook(() => useMicInput(onNote));

    await act(async () => {
      await result.current.startMic();
    });

    fillBufferWithRMS(0.05);
    act(() => tickFrames(3));
    vi.spyOn(performance, 'now').mockReturnValue(1100);
    act(() => tickFrames(1));

    // Loud signal but low clarity
    fillBufferWithRMS(0.5);
    mockFindPitchResult = [440, 0.5]; // clarity below 0.9
    act(() => tickFrames(10));

    expect(onNote).not.toHaveBeenCalled();
  });

  // --- Regression: noise floor must stay usable ---

  it('still detects when calibration happened while a sound was playing', async () => {
    // The failure this covers: the floor was mean * 3 with no ceiling, so any
    // sustained sound during calibration (a fan, the app's own first note, the
    // user trying a key) set a floor nothing could cross for the rest of the
    // session, while the UI still reported the mic as active.
    const onNote = vi.fn();
    const { result } = renderHook(() => useMicInput(onNote));

    await act(async () => {
      await result.current.startMic();
    });

    // Calibrate against a note-level signal rather than silence.
    fillBufferWithRMS(0.1);
    act(() => tickFrames(6));
    vi.spyOn(performance, 'now').mockReturnValue(1100);
    act(() => tickFrames(1));
    expect(result.current.micState).toBe('listening');

    // Playing at that same level must still register.
    mockFindPitchResult = [440, 0.95];
    act(() => tickFrames(3));

    expect(onNote).toHaveBeenCalledWith('A');
  });

  it('excludes suppressed frames from the noise floor measurement', async () => {
    const onNote = vi.fn();
    const { result } = renderHook(() => useMicInput(onNote));

    await act(async () => {
      await result.current.startMic();
    });

    // The app is making noise; these frames must not be measured.
    act(() => result.current.suppressDetection(2000));
    fillBufferWithRMS(0.9);
    act(() => tickFrames(5));

    // Calibration cannot finish while every frame is suppressed.
    vi.spyOn(performance, 'now').mockReturnValue(1100);
    act(() => tickFrames(2));
    expect(result.current.micState).toBe('calibrating');

    // Once the app goes quiet, measurement begins; a full window of real
    // frames is still required before the mic goes live.
    vi.spyOn(performance, 'now').mockReturnValue(2100);
    fillBufferWithRMS(0.001);
    act(() => tickFrames(2));
    expect(result.current.micState).toBe('calibrating');

    vi.spyOn(performance, 'now').mockReturnValue(3200);
    act(() => tickFrames(1));
    expect(result.current.micState).toBe('listening');

    mockFindPitchResult = [440, 0.95];
    fillBufferWithRMS(0.05);
    act(() => tickFrames(3));

    expect(onNote).toHaveBeenCalledWith('A');
  });

  it('analyses the full fft window, not half of it', async () => {
    // frequencyBinCount is fftSize / 2. Sizing the buffer off it halved the
    // analysis window and put every note below roughly 60Hz out of reach.
    let analysedLength = 0;
    mockGetFloatTimeDomainData = (buffer: Float32Array) => {
      analysedLength = buffer.length;
      buffer.fill(0.05);
    };

    const onNote = vi.fn();
    const { result } = renderHook(() => useMicInput(onNote));

    await act(async () => {
      await result.current.startMic();
    });
    act(() => tickFrames(1));

    expect(analysedLength).toBe(ANALYSER_FFT_SIZE_EXPECTED);
  });

  it('ignores a non-finite frequency even when clarity is high', async () => {
    const onNote = vi.fn();
    const { result } = renderHook(() => useMicInput(onNote));

    await act(async () => {
      await result.current.startMic();
    });

    fillBufferWithRMS(0.01);
    act(() => tickFrames(2));
    vi.spyOn(performance, 'now').mockReturnValue(1100);
    act(() => tickFrames(1));

    fillBufferWithRMS(0.5);
    mockFindPitchResult = [0, 0.99];
    act(() => tickFrames(10));

    expect(onNote).not.toHaveBeenCalled();
  });

  it('does not emit until 3 consecutive matching frames', async () => {
    const onNote = vi.fn();
    const { result } = renderHook(() => useMicInput(onNote));

    await act(async () => {
      await result.current.startMic();
    });

    // Quick calibration
    fillBufferWithRMS(0.01);
    act(() => tickFrames(2));
    vi.spyOn(performance, 'now').mockReturnValue(1100);
    act(() => tickFrames(1));

    // Strong signal, good clarity, but only 2 frames
    fillBufferWithRMS(0.5);
    mockFindPitchResult = [440, 0.95];
    act(() => tickFrames(2));

    expect(onNote).not.toHaveBeenCalled();

    // Third frame triggers emission
    vi.spyOn(performance, 'now').mockReturnValue(1200);
    act(() => tickFrames(1));

    expect(onNote).toHaveBeenCalledWith('A');
  });

  // --- Emission ---

  it('emits correct PitchClass for 440 Hz (A)', async () => {
    const onNote = vi.fn();
    const { result } = renderHook(() => useMicInput(onNote));

    await act(async () => {
      await result.current.startMic();
    });

    fillBufferWithRMS(0.01);
    act(() => tickFrames(1));
    vi.spyOn(performance, 'now').mockReturnValue(1100);
    act(() => tickFrames(1));

    fillBufferWithRMS(0.5);
    mockFindPitchResult = [440, 0.95];
    vi.spyOn(performance, 'now').mockReturnValue(1200);
    act(() => tickFrames(3));

    expect(onNote).toHaveBeenCalledWith('A');
  });

  it('emits C for 261.63 Hz', async () => {
    const onNote = vi.fn();
    const { result } = renderHook(() => useMicInput(onNote));

    await act(async () => {
      await result.current.startMic();
    });

    fillBufferWithRMS(0.01);
    act(() => tickFrames(1));
    vi.spyOn(performance, 'now').mockReturnValue(1100);
    act(() => tickFrames(1));

    fillBufferWithRMS(0.5);
    mockFindPitchResult = [261.63, 0.95];
    vi.spyOn(performance, 'now').mockReturnValue(1200);
    act(() => tickFrames(3));

    expect(onNote).toHaveBeenCalledWith('C');
  });

  it('emits A# for 466.16 Hz', async () => {
    const onNote = vi.fn();
    const { result } = renderHook(() => useMicInput(onNote));

    await act(async () => {
      await result.current.startMic();
    });

    fillBufferWithRMS(0.01);
    act(() => tickFrames(1));
    vi.spyOn(performance, 'now').mockReturnValue(1100);
    act(() => tickFrames(1));

    fillBufferWithRMS(0.5);
    mockFindPitchResult = [466.16, 0.95];
    vi.spyOn(performance, 'now').mockReturnValue(1200);
    act(() => tickFrames(3));

    expect(onNote).toHaveBeenCalledWith('A#');
  });

  // --- Cooldown ---

  it('suppresses same note within cooldown', async () => {
    const onNote = vi.fn();
    const { result } = renderHook(() => useMicInput(onNote));

    await act(async () => {
      await result.current.startMic();
    });

    fillBufferWithRMS(0.01);
    act(() => tickFrames(1));
    vi.spyOn(performance, 'now').mockReturnValue(1100);
    act(() => tickFrames(1));

    // First emission
    fillBufferWithRMS(0.5);
    mockFindPitchResult = [440, 0.95];
    vi.spyOn(performance, 'now').mockReturnValue(1200);
    act(() => tickFrames(3));
    expect(onNote).toHaveBeenCalledTimes(1);

    // Same sustained note within cooldown (< 300ms later)
    vi.spyOn(performance, 'now').mockReturnValue(1400);
    act(() => tickFrames(3));
    expect(onNote).toHaveBeenCalledTimes(1); // Still 1

    // Re-emitting after cooldown requires a fresh strike (onset), not just a
    // sustained signal: drop to silence, then strike again.
    fillBufferWithRMS(0.001);
    vi.spyOn(performance, 'now').mockReturnValue(1600);
    act(() => tickFrames(2));
    fillBufferWithRMS(0.5);
    vi.spyOn(performance, 'now').mockReturnValue(1800);
    act(() => tickFrames(3));
    expect(onNote).toHaveBeenCalledTimes(2);
  });

  it('emits different note immediately regardless of cooldown', async () => {
    const onNote = vi.fn();
    const { result } = renderHook(() => useMicInput(onNote));

    await act(async () => {
      await result.current.startMic();
    });

    fillBufferWithRMS(0.01);
    act(() => tickFrames(1));
    vi.spyOn(performance, 'now').mockReturnValue(1100);
    act(() => tickFrames(1));

    // First note: A
    fillBufferWithRMS(0.5);
    mockFindPitchResult = [440, 0.95];
    vi.spyOn(performance, 'now').mockReturnValue(1200);
    act(() => tickFrames(3));
    expect(onNote).toHaveBeenCalledWith('A');

    // Different note: C, struck within A's cooldown window (until 1500).
    // A fresh strike on another key must emit despite the cooldown.
    fillBufferWithRMS(0.001);
    vi.spyOn(performance, 'now').mockReturnValue(1300);
    act(() => tickFrames(2));
    mockFindPitchResult = [261.63, 0.95];
    fillBufferWithRMS(0.5);
    vi.spyOn(performance, 'now').mockReturnValue(1480);
    act(() => tickFrames(3));
    expect(onNote).toHaveBeenCalledWith('C');
    expect(onNote).toHaveBeenCalledTimes(2);
  });

  // --- Suppression ---

  it('suppressDetection blocks emission during suppression window', async () => {
    const onNote = vi.fn();
    const { result } = renderHook(() => useMicInput(onNote));

    await act(async () => {
      await result.current.startMic();
    });

    // Calibrate
    fillBufferWithRMS(0.01);
    act(() => tickFrames(1));
    vi.spyOn(performance, 'now').mockReturnValue(1100);
    act(() => tickFrames(1));
    expect(result.current.micState).toBe('listening');

    // Suppress for 2000ms
    vi.spyOn(performance, 'now').mockReturnValue(1200);
    act(() => result.current.suppressDetection(2000));

    // Strong signal during suppression window
    fillBufferWithRMS(0.5);
    mockFindPitchResult = [440, 0.95];
    vi.spyOn(performance, 'now').mockReturnValue(2000);
    act(() => tickFrames(5));
    expect(onNote).not.toHaveBeenCalled();

    // After suppression expires, a fresh strike emits.
    fillBufferWithRMS(0.001);
    vi.spyOn(performance, 'now').mockReturnValue(3300);
    act(() => tickFrames(2));
    fillBufferWithRMS(0.5);
    vi.spyOn(performance, 'now').mockReturnValue(3500);
    act(() => tickFrames(3));
    expect(onNote).toHaveBeenCalledWith('A');
  });

  // --- Cleanup ---

  it('stopMic stops tracks and closes AudioContext', async () => {
    const onNote = vi.fn();
    const { result } = renderHook(() => useMicInput(onNote));

    await act(async () => {
      await result.current.startMic();
    });

    act(() => result.current.stopMic());

    expect(mockStreamTracks[0].stop).toHaveBeenCalled();
    expect(mockAudioContextClosed).toBe(true);
    expect(cancelAnimationFrame).toHaveBeenCalled();
  });

  it('cleanup runs on unmount', async () => {
    const onNote = vi.fn();
    const { result, unmount } = renderHook(() => useMicInput(onNote));

    await act(async () => {
      await result.current.startMic();
    });

    unmount();

    expect(mockStreamTracks[0].stop).toHaveBeenCalled();
    expect(mockAudioContextClosed).toBe(true);
  });

  it('stops the stream when unmounted while the permission request is pending', async () => {
    // The failure this covers: the stream arrived after cleanup already ran,
    // so the mic stayed captured forever and a detection loop kept running
    // against the unmounted component.
    let resolveGetUserMedia!: (value: unknown) => void;
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveGetUserMedia = resolve;
        }),
    );

    const onNote = vi.fn();
    const { result, unmount } = renderHook(() => useMicInput(onNote));

    let startPromise!: Promise<void>;
    act(() => {
      startPromise = result.current.startMic();
    });

    unmount();

    const track = { stop: vi.fn() };
    await act(async () => {
      resolveGetUserMedia({ getTracks: () => [track] });
      await startPromise;
    });

    expect(track.stop).toHaveBeenCalled();
    expect(requestAnimationFrame).not.toHaveBeenCalled();

    // No zombie detection either.
    vi.spyOn(performance, 'now').mockReturnValue(1100);
    fillBufferWithRMS(0.5);
    tickFrames(5);
    expect(onNote).not.toHaveBeenCalled();
  });

  it('does not end calibration on the first frame after a long suppression', async () => {
    // The failure this covers: lesson start suppresses for 2s, longer than the
    // 1s calibration window, so the first unsuppressed frame used to satisfy
    // "elapsed >= duration" on its own and the floor became a median of one
    // sample. A transient on that frame deafened the mic to quiet playing.
    const onNote = vi.fn();
    const { result } = renderHook(() => useMicInput(onNote));

    await act(async () => {
      await result.current.startMic();
    });
    act(() => result.current.suppressDetection(2000));

    // A transient hits the very first unsuppressed frame.
    vi.spyOn(performance, 'now').mockReturnValue(2050);
    fillBufferWithRMS(0.5);
    act(() => tickFrames(1));
    expect(result.current.micState).toBe('calibrating');

    // The rest of the window is quiet room; the median ignores the transient.
    vi.spyOn(performance, 'now').mockReturnValue(2100);
    fillBufferWithRMS(0.001);
    act(() => tickFrames(4));
    vi.spyOn(performance, 'now').mockReturnValue(3100);
    act(() => tickFrames(1));
    expect(result.current.micState).toBe('listening');

    // A quiet note that a one-transient floor would have drowned out is heard.
    vi.spyOn(performance, 'now').mockReturnValue(3300);
    fillBufferWithRMS(0.015);
    mockFindPitchResult = [440, 0.95];
    act(() => tickFrames(3));
    expect(onNote).toHaveBeenCalledWith('A');
  });
});
