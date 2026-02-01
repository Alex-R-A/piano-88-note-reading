// components/LessonScreen/BlackKey.tsx
import { useMemo, useState, useRef } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import { createBlackKeyGeometry } from '@/utils/keyGeometry';
import type { PitchClass } from '@/types';

interface BlackKeyProps {
  pitchClass: PitchClass;
  position: [number, number, number];
  onClick: () => void;
  isHighlighted: boolean;
}

const BLACK_KEY_COLOR = '#2d2d2d';
const BLACK_KEY_HOVER_COLOR = '#575757';
const HIGHLIGHTED_COLOR = '#3b82f6';
const HOVER_DELAY_MS = 100;

export function BlackKey({
  pitchClass: _pitchClass,
  position,
  onClick,
  isHighlighted,
}: BlackKeyProps) {
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<number | null>(null);

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
        hoverTimeoutRef.current = window.setTimeout(() => {
          setIsHovered(true);
        }, HOVER_DELAY_MS);
      }}
      onPointerOut={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
          hoverTimeoutRef.current = null;
        }
        setIsHovered(false);
      }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <meshStandardMaterial color={color} flatShading={true} side={2} />
    </mesh>
  );
}
