// components/LessonScreen/PianoKeyboard3D.tsx
import { Canvas } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import { WhiteKey } from './WhiteKey';
import { BlackKey } from './BlackKey';
import { WebGLErrorBoundary } from '@/components/ui';
import {
  WHITE_KEY_WIDTH,
  WHITE_KEY_HEIGHT,
  WHITE_KEY_LENGTH,
  BLACK_KEY_HEIGHT,
  BLACK_KEY_LENGTH,
} from '@/utils/keyGeometry';
import { areEnharmonic } from '@/utils/noteUtils';
import type { PitchClass, NoteLetter } from '@/types';

interface PianoKeyboard3DProps {
  onKeyClick: (pitchClass: PitchClass) => void;
  highlightedKey: PitchClass | null;
}

const WHITE_KEYS: NoteLetter[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

const BLACK_KEYS: { pitchClass: PitchClass; whiteKeyIndex: number }[] = [
  { pitchClass: 'C#', whiteKeyIndex: 0 },
  { pitchClass: 'D#', whiteKeyIndex: 1 },
  { pitchClass: 'F#', whiteKeyIndex: 3 },
  { pitchClass: 'G#', whiteKeyIndex: 4 },
  { pitchClass: 'A#', whiteKeyIndex: 5 },
];

function isKeyHighlighted(
  keyPitchClass: PitchClass,
  highlightedKey: PitchClass | null
): boolean {
  if (!highlightedKey) return false;
  return areEnharmonic(keyPitchClass, highlightedKey);
}

function KeyboardScene({
  onKeyClick,
  highlightedKey,
}: PianoKeyboard3DProps) {
  const keyboardWidth = WHITE_KEYS.length * WHITE_KEY_WIDTH;
  const startX = -keyboardWidth / 2 + WHITE_KEY_WIDTH / 2;

  const whiteKeyPositions = useMemo(() => {
    return WHITE_KEYS.map((letter, index) => ({
      letter,
      pitchClass: letter as PitchClass,
      position: [
        startX + index * WHITE_KEY_WIDTH,
        WHITE_KEY_HEIGHT / 2,
        0,
      ] as [number, number, number],
    }));
  }, [startX]);

  const blackKeyPositions = useMemo(() => {
    // Position black keys so their back edge aligns with white key back edge
    // Shift forward to prevent rear overhang
    const zOffset = -(WHITE_KEY_LENGTH - BLACK_KEY_LENGTH) / 2 + 0.8;
    return BLACK_KEYS.map(({ pitchClass, whiteKeyIndex }) => ({
      pitchClass,
      position: [
        startX + (whiteKeyIndex + 0.5) * WHITE_KEY_WIDTH,
        WHITE_KEY_HEIGHT + BLACK_KEY_HEIGHT / 2,
        zOffset,
      ] as [number, number, number],
    }));
  }, [startX]);

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 20, 10]} intensity={0.8} />
      <directionalLight position={[-10, 10, -10]} intensity={0.3} />

      {whiteKeyPositions.map(({ letter, pitchClass, position }) => (
        <WhiteKey
          key={letter}
          letter={letter}
          position={position}
          onClick={() => onKeyClick(pitchClass)}
          isHighlighted={isKeyHighlighted(pitchClass, highlightedKey)}
        />
      ))}

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

export function PianoKeyboard3D({
  onKeyClick,
  highlightedKey,
}: PianoKeyboard3DProps) {
  return (
    <div
      className="rounded-lg overflow-hidden mx-auto"
      style={{ width: 1800, height: 600 }}
    >
      <WebGLErrorBoundary>
        <Canvas
          camera={{
            position: [0, 9, 18],
            fov: 14,
          }}
          gl={{ antialias: true }}
          scene={{ background: new THREE.Color('#d1d5db') }}
          onCreated={({ camera }) => {
            camera.lookAt(0, 0, 0);
          }}
        >
          <KeyboardScene
            onKeyClick={onKeyClick}
            highlightedKey={highlightedKey}
          />
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  );
}
