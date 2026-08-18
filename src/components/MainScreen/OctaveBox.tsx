// components/MainScreen/OctaveBox.tsx

import { BLACK_KEY_CENTERS } from '@/utils/keyGeometry';

// The true 0.58 black-to-white width ratio leaves ~6px tails at this size,
// which merge into a black band. Narrowed for legibility; the centres, which
// carry the recognisable offset pattern, stay exact.
const MINI_BLACK_WIDTH = 0.46;

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

/**
 * A miniature keyboard, measured in white-key widths and converted to
 * percentages so it scales with the box.
 *
 * Black key placement comes from the same layout the 3D keyboard uses, so the
 * two views of the instrument agree: C#/F# sit left of the white key boundary,
 * D#/A# right of it, and only G# lands on it.
 */
function MiniKeyboard({
  whiteCount,
  blackCenters,
}: {
  whiteCount: number;
  blackCenters: number[];
}) {
  const pct = (units: number) => `${(units / whiteCount) * 100}%`;
  // 12px of key plus a 1px hairline each, matching the original footprint so
  // the row of boxes keeps its shape.
  const width = 13 * whiteCount + 1;

  return (
    <div className="flex flex-col items-stretch" style={{ width }}>
      {/* Damper felt, as on the real instrument's key slip. */}
      <div className="h-[2px] rounded-t-[2px] bg-felt-700" />
      <div className="relative flex h-8 gap-px rounded-b-[3px] bg-ink-400 p-px shadow-key">
        {Array.from({ length: whiteCount }).map((_, i) => (
          <div
            key={i}
            className="h-full flex-1 rounded-b-[2px] bg-gradient-to-b from-ivory-50 via-ivory to-ivory-200"
          />
        ))}
        {blackCenters.map((center) => (
          <div
            key={center}
            className="absolute top-0 h-5 rounded-b-[2px] bg-gradient-to-b from-ink-700 to-ink-900 shadow-sm"
            style={{
              left: pct(center - MINI_BLACK_WIDTH / 2),
              width: pct(MINI_BLACK_WIDTH),
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function OctaveBox({ octave, checked, onToggle }: OctaveBoxProps) {
  const label = getOctaveLabel(octave);

  const renderKeys = () => {
    if (octave === 0) {
      // A0, Bb0, B0: two white keys with one black between them.
      return <MiniKeyboard whiteCount={2} blackCenters={[1]} />;
    }
    if (octave === 8) {
      return <MiniKeyboard whiteCount={1} blackCenters={[]} />;
    }
    return <MiniKeyboard whiteCount={7} blackCenters={BLACK_KEY_CENTERS} />;
  };

  return (
    <button
      onClick={onToggle}
      className={`flex flex-col items-center rounded-lg p-3 transition-all duration-200 cursor-pointer ${
        checked
          ? 'bg-brass-100 ring-1 ring-brass-500 shadow-lift'
          : 'bg-ivory-50 ring-1 ring-ink-200 hover:ring-brass-300 hover:shadow-card'
      }`}
      aria-label={`Select octave ${octave}`}
      aria-pressed={checked}
    >
      <div
        className={`mb-1.5 font-display text-sm font-semibold tracking-wide transition-colors ${
          checked ? 'text-brass-800' : 'text-ink-600'
        }`}
      >
        Oct {octave}
      </div>
      {renderKeys()}
      <div
        className={`mt-1.5 text-[10px] tracking-widest transition-colors ${
          checked ? 'text-brass-700' : 'text-ink-400'
        }`}
      >
        {label}
      </div>
    </button>
  );
}
