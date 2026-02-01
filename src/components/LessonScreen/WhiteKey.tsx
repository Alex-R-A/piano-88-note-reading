// components/LessonScreen/WhiteKey.tsx
import { useMemo, useState } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import { createWhiteKeyGeometry } from '@/utils/keyGeometry';
import type { NoteLetter, WhiteKeyProfile } from '@/types';
import { getWhiteKeyProfile } from '@/utils/noteUtils';

interface WhiteKeyProps {
  letter: NoteLetter;
  position: [number, number, number];
  onClick: () => void;
  isHighlighted: boolean;
}

// Colors
const WHITE_KEY_COLOR = '#f5f5f0'; // Off-white
const WHITE_KEY_HOVER_COLOR = '#ffffff'; // Brighter on hover
const HIGHLIGHTED_COLOR = '#3b82f6'; // Blue highlight

/**
 * 3D white key mesh with hover and highlight states.
 */
export function WhiteKey({
  letter,
  position,
  onClick,
  isHighlighted,
}: WhiteKeyProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Memoize geometry creation - expensive operation
  const geometry = useMemo(() => {
    const profile: WhiteKeyProfile = getWhiteKeyProfile(letter);
    return createWhiteKeyGeometry(profile);
  }, [letter]);

  // Determine the current color based on state
  const color = useMemo(() => {
    if (isHighlighted) return HIGHLIGHTED_COLOR;
    if (isHovered) return WHITE_KEY_HOVER_COLOR;
    return WHITE_KEY_COLOR;
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

  return (
    <mesh
      geometry={geometry}
      position={position}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
