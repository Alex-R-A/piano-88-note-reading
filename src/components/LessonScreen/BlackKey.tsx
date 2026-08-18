// components/LessonScreen/BlackKey.tsx
import { useMemo, useState, useRef } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import { createBlackKeyGeometry } from '@/utils/keyGeometry';
import type { PitchClass } from '@/types';

// Ebony is never pure black; it reads as a very dark warm grey under light.
const BLACK_KEY_COLOR = '#1c1a20';
const BLACK_KEY_HOVER_COLOR = '#3c3944';
const HIGHLIGHTED_COLOR = '#2563eb';
const HOVER_DELAY_MS = 100;

interface BlackKeyProps {
  pitchClass: PitchClass;
  position: [number, number, number];
  onClick: () => void;
  isHighlighted: boolean;
}

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
      {/* Satin ebony. Modern sharps are a matte moulding, not lacquer, so the
          roughness stays high and the coat is weak; a glossier setting turns
          the long top face into a mirror streak. */}
      <meshPhysicalMaterial
        color={color}
        roughness={0.62}
        metalness={0}
        clearcoat={0.18}
        clearcoatRoughness={0.45}
        envMapIntensity={0.45}
      />
    </mesh>
  );
}
