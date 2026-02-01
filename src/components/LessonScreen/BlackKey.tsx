// components/LessonScreen/BlackKey.tsx
import { useMemo, useState } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import { createBlackKeyGeometry } from '@/utils/keyGeometry';
import type { PitchClass } from '@/types';

interface BlackKeyProps {
  pitchClass: PitchClass;
  position: [number, number, number];
  onClick: () => void;
  isHighlighted: boolean;
}

const BLACK_KEY_COLOR = '#1a1a1a';
const BLACK_KEY_HOVER_COLOR = '#333333';
const HIGHLIGHTED_COLOR = '#3b82f6';

export function BlackKey({
  pitchClass: _pitchClass,
  position,
  onClick,
  isHighlighted,
}: BlackKeyProps) {
  const [isHovered, setIsHovered] = useState(false);

  const geometry = useMemo(() => createBlackKeyGeometry(), []);

  const color = isHighlighted
    ? HIGHLIGHTED_COLOR
    : isHovered
      ? BLACK_KEY_HOVER_COLOR
      : BLACK_KEY_COLOR;

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
