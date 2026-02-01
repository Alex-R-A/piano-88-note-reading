// components/LessonScreen/WhiteKey.tsx
import { useMemo, useState } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import { createWhiteKeyGeometry } from '@/utils/keyGeometry';
import type { NoteLetter } from '@/types';

interface WhiteKeyProps {
  letter: NoteLetter;
  position: [number, number, number];
  onClick: () => void;
  isHighlighted: boolean;
}

// Colors
const WHITE_KEY_COLOR = '#f5f5f0';
const WHITE_KEY_HOVER_COLOR = '#ffffff';
const HIGHLIGHTED_COLOR = '#3b82f6';

export function WhiteKey({
  letter: _letter,
  position,
  onClick,
  isHighlighted,
}: WhiteKeyProps) {
  const [isHovered, setIsHovered] = useState(false);

  const geometry = useMemo(() => createWhiteKeyGeometry(), []);

  const color = isHighlighted
    ? HIGHLIGHTED_COLOR
    : isHovered
      ? WHITE_KEY_HOVER_COLOR
      : WHITE_KEY_COLOR;

  return (
    <mesh
      geometry={geometry}
      position={position}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setIsHovered(true);
      }}
      onPointerOut={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setIsHovered(false);
      }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
