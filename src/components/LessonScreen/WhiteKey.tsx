// components/LessonScreen/WhiteKey.tsx
import { useMemo, useState, useRef } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import { createWhiteKeyGeometry, type WhiteKeyShape } from '@/utils/keyGeometry';
import type { NoteLetter } from '@/types';

interface WhiteKeyProps {
  letter: NoteLetter;
  shape: WhiteKeyShape;
  position: [number, number, number];
  onClick: () => void;
  isHighlighted: boolean;
}

// Colors. Key tops are warm off-white ivory rather than paper white.
const WHITE_KEY_COLOR = '#f4f1e8';
const WHITE_KEY_HOVER_COLOR = '#fffdf6';
const HIGHLIGHTED_COLOR = '#3b82f6';
const HOVER_DELAY_MS = 100;

export function WhiteKey({
  letter: _letter,
  shape,
  position,
  onClick,
  isHighlighted,
}: WhiteKeyProps) {
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<number | null>(null);

  const geometry = useMemo(() => createWhiteKeyGeometry(shape), [shape]);

  const color = isHighlighted
    ? HIGHLIGHTED_COLOR
    : isHovered
      ? WHITE_KEY_HOVER_COLOR
      : WHITE_KEY_COLOR;

  return (
    <mesh
      geometry={geometry}
      position={position}
      castShadow
      receiveShadow
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
      {/* Polished key plastic: a diffuse ivory body under a thin gloss coat. */}
      <meshPhysicalMaterial
        color={color}
        roughness={0.45}
        metalness={0}
        clearcoat={0.45}
        clearcoatRoughness={0.22}
        sheen={0.2}
        sheenColor="#fff8e8"
      />
    </mesh>
  );
}
