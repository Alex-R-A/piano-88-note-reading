// hooks/useAudio.test.ts
// initializeAudio must report failures so the UI can surface the spec's
// "Audio was blocked" / "Audio unavailable" notices instead of failing
// silently.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAudio } from './useAudio';
import { useSettingsStore } from '@/stores/settingsStore';
import { initAudio, resumeAudioContext, isAudioReady } from '@/utils/audioPlayer';

vi.mock('@/utils/audioPlayer', () => ({
  initAudio: vi.fn().mockResolvedValue(undefined),
  resumeAudioContext: vi.fn().mockResolvedValue(true),
  playNote: vi.fn(),
  isAudioReady: vi.fn(() => false),
  disposeAudio: vi.fn().mockResolvedValue(undefined),
}));

describe('useAudio initializeAudio status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(initAudio).mockResolvedValue(undefined);
    vi.mocked(resumeAudioContext).mockResolvedValue(true);
    vi.mocked(isAudioReady).mockReturnValue(false);
    useSettingsStore.setState({ audioEnabled: true });
  });

  it('returns ok when samples load and the context resumes', async () => {
    const { result } = renderHook(() => useAudio());
    let status: string | undefined;
    await act(async () => {
      status = await result.current.initializeAudio();
    });
    expect(status).toBe('ok');
    expect(result.current.isReady).toBe(true);
  });

  it('returns unavailable when sample loading fails', async () => {
    vi.mocked(initAudio).mockRejectedValue(new Error('network'));
    const { result } = renderHook(() => useAudio());
    let status: string | undefined;
    await act(async () => {
      status = await result.current.initializeAudio();
    });
    expect(status).toBe('unavailable');
    expect(result.current.isReady).toBe(false);
  });

  it('returns blocked when the context stays suspended after load', async () => {
    vi.mocked(resumeAudioContext).mockResolvedValue(false);
    const { result } = renderHook(() => useAudio());
    let status: string | undefined;
    await act(async () => {
      status = await result.current.initializeAudio();
    });
    expect(status).toBe('blocked');
  });

  it('a later call can recover from blocked once resume succeeds', async () => {
    vi.mocked(resumeAudioContext).mockResolvedValueOnce(false);
    const { result } = renderHook(() => useAudio());
    let status: string | undefined;
    await act(async () => {
      status = await result.current.initializeAudio();
    });
    expect(status).toBe('blocked');

    await act(async () => {
      status = await result.current.initializeAudio();
    });
    expect(status).toBe('ok');
  });

  it('returns ok without touching audio when audio is disabled', async () => {
    useSettingsStore.setState({ audioEnabled: false });
    const { result } = renderHook(() => useAudio());
    let status: string | undefined;
    await act(async () => {
      status = await result.current.initializeAudio();
    });
    expect(status).toBe('ok');
    expect(initAudio).not.toHaveBeenCalled();
  });
});
