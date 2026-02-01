// components/LessonScreen/PianoKeyboard3D.tsx
import { Canvas } from '@react-three/fiber';
import { useMemo } from 'react';
import { WhiteKey } from './WhiteKey';
import { BlackKey } from './BlackKey';
import {
  WHITE_KEY_WIDTH,
  WHITE_KEY_HEIGHT,
  WHITE_KEY_LENGTH,
} from '@/utils/keyGeometry';
import { areEnharmonic } from '@/utils/noteUtils';
import type { PitchClass, NoteLetter } from '@/types';

interface PianoKeyboard3DProps {
  onKeyClick: (pitchClass: PitchClass) => void;
  highlightedKey: PitchClass | null;
}

// White keys in order: C, D, E, F, G, A, B
const WHITE_KEYS: NoteLetter[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

// Black keys with their pitch classes and positions relative to white keys
// Position is the index of the white key to the LEFT of the black key
// C#/Db is between C (0) and D (1), so it's at position 0.5
const BLACK_KEYS: { pitchClass: PitchClass; whiteKeyIndex: number }[] = [
  { pitchClass: 'C#', whiteKeyIndex: 0 }, // Between C and D
  { pitchClass: 'D#', whiteKeyIndex: 1 }, // Between D and E
  { pitchClass: 'F#', whiteKeyIndex: 3 }, // Between F and G
  { pitchClass: 'G#', whiteKeyIndex: 4 }, // Between G and A
  { pitchClass: 'A#', whiteKeyIndex: 5 }, // Between A and B
];

/**
 * Check if a pitch class should be highlighted.
 * Uses enharmonic equivalence check.
 */
function isKeyHighlighted(
  keyPitchClass: PitchClass,
  highlightedKey: PitchClass | null
): boolean {
  if (!highlightedKey) return false;
  return areEnharmonic(keyPitchClass, highlightedKey);
}

/**
 * The actual 3D scene content (must be inside Canvas)
 */
function KeyboardScene({
  onKeyClick,
  highlightedKey,
}: PianoKeyboard3DProps) {
  // Calculate keyboard dimensions for centering
  const keyboardWidth = WHITE_KEYS.length * WHITE_KEY_WIDTH;
  const startX = -keyboardWidth / 2 + WHITE_KEY_WIDTH / 2;

  // Memoize white key data
  const whiteKeyPositions = useMemo(() => {
    return WHITE_KEYS.map((letter, index) => ({
      letter,
      pitchClass: letter as PitchClass,
      position: [
        startX + index * WHITE_KEY_WIDTH,
        WHITE_KEY_HEIGHT / 2,
        WHITE_KEY_LENGTH / 2,
      ] as [number, number, number],
    }));
  }, [startX]);

  // Memoize black key data
  const blackKeyPositions = useMemo(() => {
    return BLACK_KEYS.map(({ pitchClass, whiteKeyIndex }) => ({
      pitchClass,
      position: [
        startX + (whiteKeyIndex + 0.5) * WHITE_KEY_WIDTH,
        WHITE_KEY_HEIGHT,
        WHITE_KEY_LENGTH / 2,
      ] as [number, number, number],
    }));
  }, [startX]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} />
      <directionalLight position={[-5, 5, -5]} intensity={0.3} />

      {/* White Keys */}
      {whiteKeyPositions.map(({ letter, pitchClass, position }) => (
        <WhiteKey
          key={letter}
          letter={letter}
          position={position}
          onClick={() => onKeyClick(pitchClass)}
          isHighlighted={isKeyHighlighted(pitchClass, highlightedKey)}
        />
      ))}

      {/* Black Keys */}
      {blackKeyPositions.map(({ pitchClass, position }) => (
        <BlackKey
          key={pitchClass}
          pitchClass={pitchClass}
          position={position}
          onClick={() => onKeyClick(pitchClass)}
          isHighlighted={isKeyHighlighted(pitchClass, highlightedKey)}
        />
      ))}
    </>
  );
}

/**
 * 3D Piano Keyboard component with React Three Fiber.
 * Displays a single octave (7 white keys, 5 black keys).
 * Camera positioned per spec: position(0, 5, 8), lookAt(0, 0, 0), fov 50.
 */
export function PianoKeyboard3D({
  onKeyClick,
  highlightedKey,
}: PianoKeyboard3DProps) {
  return (
    <div
      className="bg-gray-800 rounded-lg overflow-hidden"
      style={{ width: 600, height: 250 }}
    >
      <Canvas
        camera={{
          position: [0, 5, 8],
          fov: 50,
        }}
        gl={{ antialias: true }}
        onCreated={({ camera }) => {
          camera.lookAt(0, 0, 0);
        }}
      >
        <KeyboardScene
          onKeyClick={onKeyClick}
          highlightedKey={highlightedKey}
        />
      </Canvas>
    </div>
  );
}
