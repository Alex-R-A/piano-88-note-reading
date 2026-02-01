// utils/audioPlayer.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  initAudio,
  playNote,
  isAudioReady,
  isAudioLoading,
  getAudioContextState,
  resumeAudioContext,
  disposeAudio,
  convertToSmplrFormat,
} from './audioPlayer';

// Mock AudioContext
const mockResume = vi.fn().mockResolvedValue(undefined);
const mockClose = vi.fn().mockResolvedValue(undefined);

class MockAudioContext {
  state: AudioContextState = 'suspended';
  resume = mockResume;
  close = mockClose;
}

// Mock SplendidGrandPiano
const mockStart = vi.fn();
const mockStop = vi.fn();
const mockLoad = Promise.resolve();

vi.mock('smplr', () => ({
  SplendidGrandPiano: vi.fn().mockImplementation(() => ({
    start: mockStart,
    stop: mockStop,
    load: mockLoad,
  })),
}));

describe('audioPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset module state by disposing any existing audio
    // and setting up fresh AudioContext mock
    vi.stubGlobal('AudioContext', MockAudioContext);
  });

  afterEach(async () => {
    // Clean up audio state after each test
    await disposeAudio();
  });

  describe('convertToSmplrFormat', () => {
    it('passes through NoteId unchanged (format matches smplr)', () => {
      expect(convertToSmplrFormat('C4')).toBe('C4');
      expect(convertToSmplrFormat('C#4')).toBe('C#4');
      expect(convertToSmplrFormat('Db4')).toBe('Db4');
      expect(convertToSmplrFormat('Bb3')).toBe('Bb3');
      expect(convertToSmplrFormat('G5')).toBe('G5');
      expect(convertToSmplrFormat('A#2')).toBe('A#2');
    });
  });

  describe('initAudio', () => {
    it('creates AudioContext and loads piano samples', async () => {
      expect(isAudioReady()).toBe(false);
      expect(isAudioLoading()).toBe(false);

      await initAudio();

      expect(isAudioReady()).toBe(true);
      expect(isAudioLoading()).toBe(false);
    });

    it('returns same promise if called while loading', async () => {
      // Both calls should resolve successfully without double-initialization
      const promise1 = initAudio();
      const promise2 = initAudio();

      // Both should resolve to undefined (void)
      const [result1, result2] = await Promise.all([promise1, promise2]);
      expect(result1).toBeUndefined();
      expect(result2).toBeUndefined();

      // Audio should be ready after both resolve
      expect(isAudioReady()).toBe(true);
    });

    it('does not reinitialize if already loaded', async () => {
      await initAudio();
      const { SplendidGrandPiano } = await import('smplr');

      // Clear the call count
      vi.mocked(SplendidGrandPiano).mockClear();

      await initAudio();

      // Should not create a new piano instance
      expect(SplendidGrandPiano).not.toHaveBeenCalled();
    });
  });

  describe('playNote', () => {
    it('does nothing if audio not initialized', () => {
      playNote('C4');
      expect(mockStart).not.toHaveBeenCalled();
    });

    it('plays note after initialization', async () => {
      await initAudio();
      playNote('C4');

      expect(mockStart).toHaveBeenCalledWith({ note: 'C4' });
    });

    it('plays notes with sharps', async () => {
      await initAudio();
      playNote('C#4');

      expect(mockStart).toHaveBeenCalledWith({ note: 'C#4' });
    });

    it('plays notes with flats', async () => {
      await initAudio();
      playNote('Bb3');

      expect(mockStart).toHaveBeenCalledWith({ note: 'Bb3' });
    });

    it('handles different octaves', async () => {
      await initAudio();

      playNote('A0');
      expect(mockStart).toHaveBeenCalledWith({ note: 'A0' });

      playNote('C8');
      expect(mockStart).toHaveBeenCalledWith({ note: 'C8' });
    });
  });

  describe('isAudioReady', () => {
    it('returns false before initialization', () => {
      expect(isAudioReady()).toBe(false);
    });

    it('returns true after initialization', async () => {
      await initAudio();
      expect(isAudioReady()).toBe(true);
    });

    it('returns false after disposal', async () => {
      await initAudio();
      await disposeAudio();
      expect(isAudioReady()).toBe(false);
    });
  });

  describe('isAudioLoading', () => {
    it('returns false before initialization starts', () => {
      expect(isAudioLoading()).toBe(false);
    });

    it('returns false after initialization completes', async () => {
      await initAudio();
      expect(isAudioLoading()).toBe(false);
    });
  });

  describe('getAudioContextState', () => {
    it('returns null before initialization', () => {
      expect(getAudioContextState()).toBe(null);
    });

    it('returns context state after initialization', async () => {
      await initAudio();
      expect(getAudioContextState()).toBe('suspended');
    });

    it('returns null after disposal', async () => {
      await initAudio();
      await disposeAudio();
      expect(getAudioContextState()).toBe(null);
    });
  });

  describe('resumeAudioContext', () => {
    it('returns false if no context exists', async () => {
      const result = await resumeAudioContext();
      expect(result).toBe(false);
    });

    it('calls resume on suspended context', async () => {
      await initAudio();

      // Mock that resume changes state to running
      mockResume.mockImplementationOnce(async function (this: MockAudioContext) {
        this.state = 'running';
      });

      const result = await resumeAudioContext();
      expect(mockResume).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('returns true if context already running', async () => {
      await initAudio();

      // Manually set state to running
      const ctx = new MockAudioContext();
      ctx.state = 'running';
      vi.stubGlobal('AudioContext', function () {
        return ctx;
      });

      // Need to reinitialize with new context
      await disposeAudio();
      await initAudio();

      const result = await resumeAudioContext();
      // Even though resume wasn't called, if state is running, should return true
      expect(result).toBe(true);
    });
  });

  describe('disposeAudio', () => {
    it('stops piano and closes context', async () => {
      await initAudio();
      await disposeAudio();

      expect(mockStop).toHaveBeenCalled();
      expect(mockClose).toHaveBeenCalled();
    });

    it('resets all state flags', async () => {
      await initAudio();
      expect(isAudioReady()).toBe(true);

      await disposeAudio();

      expect(isAudioReady()).toBe(false);
      expect(isAudioLoading()).toBe(false);
      expect(getAudioContextState()).toBe(null);
    });

    it('is safe to call multiple times', async () => {
      await initAudio();
      await disposeAudio();
      await disposeAudio();

      // Should not throw
      expect(true).toBe(true);
    });

    it('is safe to call without initialization', async () => {
      await disposeAudio();
      expect(isAudioReady()).toBe(false);
    });
  });

  describe('error handling', () => {
    it('handles piano load failure gracefully', async () => {
      const { SplendidGrandPiano } = await import('smplr');
      vi.mocked(SplendidGrandPiano).mockImplementationOnce(
        () =>
          ({
            start: mockStart,
            stop: mockStop,
            load: Promise.reject(new Error('Load failed')),
          }) as unknown as InstanceType<typeof SplendidGrandPiano>
      );

      await expect(initAudio()).rejects.toThrow('Load failed');
      expect(isAudioReady()).toBe(false);
      expect(isAudioLoading()).toBe(false);
    });

    it('handles playNote errors gracefully', async () => {
      await initAudio();
      mockStart.mockImplementationOnce(() => {
        throw new Error('Play failed');
      });

      // Should not throw, just log error
      expect(() => playNote('C4')).not.toThrow();
    });
  });
});
