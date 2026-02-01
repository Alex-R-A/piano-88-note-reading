// stores/settingsStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from './settingsStore';

describe('settingsStore', () => {
  // Reset store before each test
  beforeEach(() => {
    useSettingsStore.setState({
      selectedOctaves: new Set([4]),
      includeSharpsFlats: false,
      audioEnabled: true,
      showCorrectAnswer: false,
    });
  });

  describe('default state', () => {
    it('has octave 4 selected by default', () => {
      const state = useSettingsStore.getState();
      expect(state.selectedOctaves.has(4)).toBe(true);
      expect(state.selectedOctaves.size).toBe(1);
    });

    it('has includeSharpsFlats off by default', () => {
      const state = useSettingsStore.getState();
      expect(state.includeSharpsFlats).toBe(false);
    });

    it('has audioEnabled on by default', () => {
      const state = useSettingsStore.getState();
      expect(state.audioEnabled).toBe(true);
    });

    it('has showCorrectAnswer off by default', () => {
      const state = useSettingsStore.getState();
      expect(state.showCorrectAnswer).toBe(false);
    });
  });

  describe('toggleOctave', () => {
    it('adds an octave when not present', () => {
      useSettingsStore.getState().toggleOctave(3);
      const state = useSettingsStore.getState();
      expect(state.selectedOctaves.has(3)).toBe(true);
      expect(state.selectedOctaves.has(4)).toBe(true);
      expect(state.selectedOctaves.size).toBe(2);
    });

    it('removes an octave when present', () => {
      useSettingsStore.getState().toggleOctave(4);
      const state = useSettingsStore.getState();
      expect(state.selectedOctaves.has(4)).toBe(false);
      expect(state.selectedOctaves.size).toBe(0);
    });

    it('can toggle multiple octaves', () => {
      const { toggleOctave } = useSettingsStore.getState();
      toggleOctave(0);
      toggleOctave(1);
      toggleOctave(7);
      const state = useSettingsStore.getState();
      expect(state.selectedOctaves.size).toBe(4);
      expect(state.selectedOctaves.has(0)).toBe(true);
      expect(state.selectedOctaves.has(1)).toBe(true);
      expect(state.selectedOctaves.has(4)).toBe(true);
      expect(state.selectedOctaves.has(7)).toBe(true);
    });

    it('toggle on then off returns to original state', () => {
      useSettingsStore.getState().toggleOctave(5);
      expect(useSettingsStore.getState().selectedOctaves.has(5)).toBe(true);
      useSettingsStore.getState().toggleOctave(5);
      expect(useSettingsStore.getState().selectedOctaves.has(5)).toBe(false);
    });
  });

  describe('setIncludeSharpsFlats', () => {
    it('sets to true', () => {
      useSettingsStore.getState().setIncludeSharpsFlats(true);
      expect(useSettingsStore.getState().includeSharpsFlats).toBe(true);
    });

    it('sets to false', () => {
      useSettingsStore.getState().setIncludeSharpsFlats(true);
      useSettingsStore.getState().setIncludeSharpsFlats(false);
      expect(useSettingsStore.getState().includeSharpsFlats).toBe(false);
    });
  });

  describe('setAudioEnabled', () => {
    it('sets to false', () => {
      useSettingsStore.getState().setAudioEnabled(false);
      expect(useSettingsStore.getState().audioEnabled).toBe(false);
    });

    it('sets back to true', () => {
      useSettingsStore.getState().setAudioEnabled(false);
      useSettingsStore.getState().setAudioEnabled(true);
      expect(useSettingsStore.getState().audioEnabled).toBe(true);
    });
  });

  describe('setShowCorrectAnswer', () => {
    it('sets to true', () => {
      useSettingsStore.getState().setShowCorrectAnswer(true);
      expect(useSettingsStore.getState().showCorrectAnswer).toBe(true);
    });

    it('sets to false', () => {
      useSettingsStore.getState().setShowCorrectAnswer(true);
      useSettingsStore.getState().setShowCorrectAnswer(false);
      expect(useSettingsStore.getState().showCorrectAnswer).toBe(false);
    });
  });

  describe('isStartEnabled', () => {
    it('returns true when at least one octave selected', () => {
      expect(useSettingsStore.getState().isStartEnabled()).toBe(true);
    });

    it('returns false when no octaves selected', () => {
      useSettingsStore.getState().toggleOctave(4); // Remove default
      expect(useSettingsStore.getState().isStartEnabled()).toBe(false);
    });

    it('returns true with multiple octaves selected', () => {
      useSettingsStore.getState().toggleOctave(3);
      useSettingsStore.getState().toggleOctave(5);
      expect(useSettingsStore.getState().isStartEnabled()).toBe(true);
    });
  });
});
