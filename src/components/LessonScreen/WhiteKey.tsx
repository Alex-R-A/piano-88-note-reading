// components/LessonScreen/WhiteKey.tsx
import { useEffect, useMemo, useState, useRef } from 'react';
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
// A warm brass-cream, not a brighter white: a few-percent brightening is
// invisible on many monitors, while a hue shift reads on all of them.
const WHITE_KEY_HOVER_COLOR = '#eBdcb7';
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
  const [isPressed, setIsPressed] = useState(false);
  const hoverTimeoutRef = useRef<number | null>(null);

  const geometry = useMemo(() => createWhiteKeyGeometry(shape), [shape]);

  // The keys are click targets, so the cursor shows the pointing hand while
  // over one. Set directly (not via the delayed hover state) so it reacts
  // instantly, and cleared on unmount in case the lesson ends mid-hover.
  useEffect(() => () => {
    document.body.style.cursor = '';
  }, []);

  const hovered = isHovered && !isHighlighted;
  const color = isHighlighted
    ? HIGHLIGHTED_COLOR
    : hovered
      ? WHITE_KEY_HOVER_COLOR
      : WHITE_KEY_COLOR;

  return (
    <mesh
      geometry={geometry}
      // The key sinks only while actually held down. Hover must not move it:
      // a sunken key reads as "already pressed", not "press me".
      position={isPressed ? [position[0], position[1] - 0.06, position[2]] : position}
      castShadow
      receiveShadow
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
        hoverTimeoutRef.current = window.setTimeout(() => {
          setIsHovered(true);
        }, HOVER_DELAY_MS);
      }}
      onPointerOut={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        document.body.style.cursor = '';
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
          hoverTimeoutRef.current = null;
        }
        setIsHovered(false);
        setIsPressed(false);
      }}
      onPointerDown={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setIsPressed(true);
      }}
      onPointerUp={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setIsPressed(false);
      }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {/* Polished key plastic: a diffuse ivory body under a thin gloss coat.
          The hover tint alone washes out on the strongly-lit top face, so a
          faint brass emissive carries the hover cue on every face. */}
      <meshPhysicalMaterial
        color={color}
        roughness={0.45}
        metalness={0}
        clearcoat={0.45}
        clearcoatRoughness={0.22}
        sheen={0.2}
        sheenColor="#fff8e8"
        emissive={hovered ? '#8a6d2b' : '#000000'}
        emissiveIntensity={hovered ? 0.35 : 0}
      />
    </mesh>
  );
}
