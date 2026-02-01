// components/MainScreen/OctaveBox.tsx

interface OctaveBoxProps {
  octave: number;
  checked: boolean;
  onToggle: () => void;
}

// Octave 0: A0, Bb0, B0 (3 keys: 2 white, 1 black)
// Octaves 1-7: Full 12 notes (7 white, 5 black)
// Octave 8: C8 only (1 white)

function getOctaveLabel(octave: number): string {
  if (octave === 0) {
    return '(A-B)';
  }
  if (octave === 8) {
    return '(C)';
  }
  return '(C-B)';
}

export function OctaveBox({ octave, checked, onToggle }: OctaveBoxProps) {
  const label = getOctaveLabel(octave);

  // Render simplified 2D keys within the octave box
  // Black keys sit between specific white keys: C#(C-D), D#(D-E), F#(F-G), G#(G-A), A#(A-B)
  const renderKeys = () => {
    if (octave === 0) {
      // A0, Bb0, B0 - special layout
      return (
        <div className="flex h-8 gap-px">
          {/* A key (white) */}
          <div className="relative w-3 h-full">
            <div className="absolute inset-0 bg-white border border-gray-400 rounded-b-sm" />
            {/* Black key Bb between A and B */}
            <div className="absolute -right-1 top-0 w-2 h-5 bg-gray-800 z-10 rounded-b-sm" />
          </div>
          {/* B key (white) */}
          <div className="w-3 h-full bg-white border border-gray-400 rounded-b-sm" />
        </div>
      );
    }

    if (octave === 8) {
      // C8 only
      return (
        <div className="flex h-8">
          <div className="w-3 h-full bg-white border border-gray-400 rounded-b-sm" />
        </div>
      );
    }

    // Full octave: C D E F G A B with black keys
    // Black keys between: C-D, D-E, F-G, G-A, A-B
    const whiteKeyWidth = 'w-3';
    const blackKeyPositions = [0, 1, 3, 4, 5]; // Index of white key that has black key to its right

    return (
      <div className="relative flex h-8 gap-px">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className={`relative ${whiteKeyWidth} h-full`}>
            <div className="absolute inset-0 bg-white border border-gray-400 rounded-b-sm" />
            {blackKeyPositions.includes(i) && (
              <div className="absolute -right-1 top-0 w-2 h-5 bg-gray-800 z-10 rounded-b-sm" />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <button
      onClick={onToggle}
      className={`flex flex-col items-center p-3 rounded-lg transition-all cursor-pointer ${
        checked
          ? 'bg-emerald-50 border-2 border-emerald-400 shadow-md'
          : 'bg-white border-2 border-slate-200 hover:border-slate-300 hover:shadow-sm'
      }`}
      aria-label={`Select octave ${octave}`}
      aria-pressed={checked}
    >
      {/* Octave visualization */}
      <div className="text-xs font-medium text-slate-600 mb-1">Oct {octave}</div>
      {renderKeys()}
      <div className="text-[10px] text-slate-400 mt-1">{label}</div>
    </button>
  );
}
