// components/MainScreen/PianoOverview.tsx

import { OctaveBox } from './OctaveBox';

interface PianoOverviewProps {
  selectedOctaves: Set<number>;
  onToggleOctave: (octave: number) => void;
}

// All 9 octave groups on an 88-key piano
const OCTAVES = [0, 1, 2, 3, 4, 5, 6, 7, 8];

export function PianoOverview({ selectedOctaves, onToggleOctave }: PianoOverviewProps) {
  return (
    <div className="flex justify-center gap-2 flex-wrap">
      {OCTAVES.map((octave) => (
        <OctaveBox
          key={octave}
          octave={octave}
          checked={selectedOctaves.has(octave)}
          onToggle={() => onToggleOctave(octave)}
        />
      ))}
    </div>
  );
}
