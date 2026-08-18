// hooks/useLessonEngine.playback.test.ts
// Regressions for the note-playback retry chain: it must die with its
// selection. Left running, it played ghost notes after the lesson screen
// unmounted and played superseded notes once samples finished loading.
// Kept separate from useLessonEngine.test.ts because these tests mock the
// audioPlayer module, which that file deliberately uses for real.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLessonEngine, TOTAL_FEEDBACK_TIME } from './useLessonEngine';
import { useLessonStore } from '@/stores/lessonStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { playNote, isAudioReady } from '@/utils/audioPlayer';

vi.mock('@/utils/audioPlayer', () => ({
  initAudio: vi.fn().mockResolvedValue(undefined),
  resumeAudioContext: vi.fn().mockResolvedValue(true),
  playNote: vi.fn(),
  isAudioReady: vi.fn(() => true),
  disposeAudio: vi.fn().mockResolvedValue(undefined),
}));

describe('useLessonEngine playback chain lifetime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    vi.mocked(isAudioReady).mockImplementation(() => true);

    useLessonStore.setState({
      isActive: false,
      fullNoteSet: [],
      remainingNotes: new Set(),
      errorWeights: new Map(),
      recentBuffer: [],
      currentNote: null,
      noteSelectionId: 0,
      stats: new Map(),
      feedbackState: 'none',
    });
    useSettingsStore.setState({
      selectedOctaves: new Set([4]),
      includeSharpsFlats: false,
      audioEnabled: true,
      showCorrectAnswer: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not play a note whose playback was pending when the engine unmounted', () => {
    // The ghost-note sequence: Stop is clicked late in the feedback window, so
    // the advance timer fires during the exit transition, selects a new note,
    // and that note's playback timer used to outlive the unmount.
    const { result, unmount } = renderHook(() => useLessonEngine());

    act(() => {
      result.current.startLesson(['C4', 'D4', 'E4', 'F4', 'G4']);
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    const note1 = result.current.currentNote!;
    expect(playNote).toHaveBeenCalledWith(note1);

    act(() => {
      result.current.handleKeyClick(note1.replace(/\d/, ''));
    });
    // Advance timer fires: next note selected, its playback pending at +100ms.
    act(() => {
      vi.advanceTimersByTime(TOTAL_FEEDBACK_TIME);
    });
    const callsBeforeUnmount = vi.mocked(playNote).mock.calls.length;

    unmount();

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(vi.mocked(playNote).mock.calls.length).toBe(callsBeforeUnmount);
  });

  it('cancels the previous note chain when a new note is selected', () => {
    // While samples are loading, each selection used to stack another polling
    // chain that kept its own note; when loading finished, superseded notes
    // played alongside the current one.
    const t0 = Date.now();
    vi.mocked(isAudioReady).mockImplementation(() => Date.now() - t0 >= 1500);

    const { result } = renderHook(() => useLessonEngine());

    act(() => {
      result.current.startLesson(['C4', 'D4', 'E4', 'F4', 'G4']);
    });
    const note1 = result.current.currentNote!;

    // First poll at +100 finds audio not ready.
    act(() => {
      vi.advanceTimersByTime(200);
    });
    act(() => {
      result.current.handleKeyClick(note1.replace(/\d/, ''));
    });
    // Advance timer at +1200 selects the next note and must kill note1's chain.
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    const note2 = useLessonStore.getState().currentNote!;
    expect(note2).not.toBe(note1);

    // Audio becomes ready at +1500; only the current note may play.
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(playNote).toHaveBeenCalledWith(note2);
    expect(playNote).not.toHaveBeenCalledWith(note1);
    expect(playNote).toHaveBeenCalledTimes(1);
  });
});
