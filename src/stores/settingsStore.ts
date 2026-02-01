// stores/settingsStore.ts
import { create } from 'zustand';

interface SettingsStore {
  selectedOctaves: Set<number>;
  includeSharpsFlats: boolean;
  audioEnabled: boolean;
  showCorrectAnswer: boolean;

  // Actions
  toggleOctave: (octave: number) => void;
  setIncludeSharpsFlats: (value: boolean) => void;
  setAudioEnabled: (value: boolean) => void;
  setShowCorrectAnswer: (value: boolean) => void;
  isStartEnabled: () => boolean;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  selectedOctaves: new Set([4]), // Default: octave 4 only (middle C octave)
  includeSharpsFlats: false, // Default: off
  audioEnabled: true, // Default: on
  showCorrectAnswer: false, // Default: off

  toggleOctave: (octave) =>
    set((state) => {
      const newSet = new Set(state.selectedOctaves);
      if (newSet.has(octave)) {
        newSet.delete(octave);
      } else {
        newSet.add(octave);
      }
      return { selectedOctaves: newSet };
    }),

  setIncludeSharpsFlats: (value) => set({ includeSharpsFlats: value }),
  setAudioEnabled: (value) => set({ audioEnabled: value }),
  setShowCorrectAnswer: (value) => set({ showCorrectAnswer: value }),

  isStartEnabled: () => get().selectedOctaves.size > 0,
}));
