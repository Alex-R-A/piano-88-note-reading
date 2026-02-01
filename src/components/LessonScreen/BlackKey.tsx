// components/LessonScreen/BlackKey.tsx
import { useMemo, useState } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import {
  createBlackKeyGeometry,
  BLACK_KEY_HEIGHT,
  BLACK_KEY_LENGTH,
  WHITE_KEY_LENGTH,
} from '@/utils/keyGeometry';
import type { PitchClass } from '@/types';

interface BlackKeyProps {
  pitchClass: PitchClass;
  position: [number, number, number];
  onClick: () => void;
  isHighlighted: boolean;
}

// Colors
const BLACK_KEY_COLOR = '#1a1a1a'; // Near-black
const BLACK_KEY_HOVER_COLOR = '#333333'; // Slightly brighter on hover
const HIGHLIGHTED_COLOR = '#3b82f6'; // Blue highlight

// Black keys sit ON TOP of white keys (elevated in Y) and toward the BACK (positive Z)
// Z offset: positions black key at the back 60% of white key where the notches are
export const BLACK_KEY_Z_OFFSET = (WHITE_KEY_LENGTH - BLACK_KEY_LENGTH) / 2;

/**
 * 3D black key mesh with hover and highlight states.
 * Positioned above and forward of white keys.
 */
export function BlackKey({
  pitchClass: _pitchClass,
  position,
  onClick,
  isHighlighted,
}: BlackKeyProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Memoize geometry creation
  const geometry = useMemo(() => createBlackKeyGeometry(), []);

  // Determine the current color based on state
  const color = useMemo(() => {
    if (isHighlighted) return HIGHLIGHTED_COLOR;
    if (isHovered) return BLACK_KEY_HOVER_COLOR;
    return BLACK_KEY_COLOR;
  }, [isHighlighted, isHovered]);

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsHovered(true);
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsHovered(false);
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick();
  };

  // Adjust position for black key placement:
  // - X: use passed position (centered between white keys)
  // - Y: black keys sit ON TOP of white keys (their bottom touches white key top surface)
  //      position[1] is WHITE_KEY_HEIGHT (the Y of white key top surface)
  //      Black key center should be at: WHITE_KEY_HEIGHT + BLACK_KEY_HEIGHT/2
  // - Z: black keys are at the BACK of white keys (positive Z direction)
  //      position[2] is WHITE_KEY_LENGTH/2 (center of white key in Z)
  //      We offset toward back by BLACK_KEY_Z_OFFSET
  const adjustedPosition: [number, number, number] = [
    position[0],
    position[1] + BLACK_KEY_HEIGHT / 2,
    position[2] + BLACK_KEY_Z_OFFSET,
  ];

  return (
    <mesh
      geometry={geometry}
      position={adjustedPosition}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
