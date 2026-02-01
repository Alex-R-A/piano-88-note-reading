// utils/keyGeometry.ts
import * as THREE from 'three';
import type { WhiteKeyProfile } from '@/types';

// Key dimensions (relative units) per spec lines 844-852
const WHITE_KEY_WIDTH = 1;
const WHITE_KEY_LENGTH = 5;
const WHITE_KEY_HEIGHT = 0.5;
const BLACK_KEY_WIDTH = 0.6;
const BLACK_KEY_LENGTH = 3;
const BLACK_KEY_HEIGHT = 0.5;
const NOTCH_DEPTH = BLACK_KEY_LENGTH;
const NOTCH_WIDTH = BLACK_KEY_WIDTH / 2 + 0.05; // Half black key + gap

/**
 * Create white key geometry with appropriate notch profile.
 * The geometry is created in the XZ plane with Y as height.
 *
 * Type 1 (C, F): notch on right only
 * Type 2 (D, G, A): notches on both sides
 * Type 3 (E, B): notch on left only
 */
export function createWhiteKeyGeometry(
  profile: WhiteKeyProfile
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const halfWidth = WHITE_KEY_WIDTH / 2;

  // Start at bottom-left corner
  shape.moveTo(-halfWidth, 0);

  // Draw the shape clockwise
  // Left side going up
  if (profile === 'type2' || profile === 'type3') {
    // Has left notch: go up partway, then notch in, then continue up
    shape.lineTo(-halfWidth, WHITE_KEY_LENGTH - NOTCH_DEPTH);
    shape.lineTo(-halfWidth + NOTCH_WIDTH, WHITE_KEY_LENGTH - NOTCH_DEPTH);
    shape.lineTo(-halfWidth + NOTCH_WIDTH, WHITE_KEY_LENGTH);
  } else {
    // No left notch: straight up
    shape.lineTo(-halfWidth, WHITE_KEY_LENGTH);
  }

  // Top edge (left to right)
  if (profile === 'type2' || profile === 'type1') {
    // Has right notch
    shape.lineTo(halfWidth - NOTCH_WIDTH, WHITE_KEY_LENGTH);
    shape.lineTo(halfWidth - NOTCH_WIDTH, WHITE_KEY_LENGTH - NOTCH_DEPTH);
    shape.lineTo(halfWidth, WHITE_KEY_LENGTH - NOTCH_DEPTH);
  } else {
    // No right notch
    shape.lineTo(halfWidth, WHITE_KEY_LENGTH);
  }

  // Right side going down
  shape.lineTo(halfWidth, 0);

  // Bottom edge (right to left) - back to start
  shape.lineTo(-halfWidth, 0);

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: WHITE_KEY_HEIGHT,
    bevelEnabled: false,
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

  // Rotate so the key lies flat (Y is up, Z is the key length direction)
  // ExtrudeGeometry creates the shape in XY plane, extruded along Z
  // We want the key to lie in XZ plane with Y as height
  geometry.rotateX(-Math.PI / 2);

  return geometry;
}

/**
 * Create black key geometry (simple box).
 * Dimensions per spec line 879-881.
 */
export function createBlackKeyGeometry(): THREE.BoxGeometry {
  return new THREE.BoxGeometry(
    BLACK_KEY_WIDTH,
    BLACK_KEY_HEIGHT,
    BLACK_KEY_LENGTH
  );
}

// Export dimensions for use in positioning
export {
  WHITE_KEY_WIDTH,
  WHITE_KEY_LENGTH,
  WHITE_KEY_HEIGHT,
  BLACK_KEY_WIDTH,
  BLACK_KEY_LENGTH,
  BLACK_KEY_HEIGHT,
};
