// components/LessonScreen/BlackKey.tsx
import { useMemo, useState } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import {
  createBlackKeyGeometry,
  BLACK_KEY_HEIGHT,
  BLACK_KEY_LENGTH,
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

// Black keys raised above white keys by ~40% of black key length
// The position.y should be WHITE_KEY_HEIGHT / 2 + BLACK_KEY_HEIGHT / 2
// But we also need to position the key forward (negative Z) so it sits in the notches
export const BLACK_KEY_Z_OFFSET = -BLACK_KEY_LENGTH * 0.4;

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

  // Adjust Y position to raise black key above white key
  // The passed position already includes the base X position,
  // we add the height offset here for Y
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
