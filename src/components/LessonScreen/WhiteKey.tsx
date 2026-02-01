// components/LessonScreen/WhiteKey.tsx
import { useMemo, useState, useRef } from 'react';
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
const HOVER_DELAY_MS = 100;

export function WhiteKey({
  letter: _letter,
  position,
  onClick,
  isHighlighted,
}: WhiteKeyProps) {
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<number | null>(null);

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
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
