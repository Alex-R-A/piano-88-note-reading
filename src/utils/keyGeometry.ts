// utils/keyGeometry.ts
import * as THREE from 'three';

// Key dimensions (relative units)
export const WHITE_KEY_WIDTH = 1;
export const WHITE_KEY_LENGTH = 5;
export const WHITE_KEY_HEIGHT = 0.6;
export const BLACK_KEY_WIDTH = 0.55;
export const BLACK_KEY_LENGTH = 3;
export const BLACK_KEY_HEIGHT = 0.5;

// Gap between white keys
export const KEY_GAP = 0.05;

/**
 * Create white key geometry - simple box.
 * The notch effect is achieved by black keys overlapping.
 */
export function createWhiteKeyGeometry(): THREE.BoxGeometry {
  return new THREE.BoxGeometry(
    WHITE_KEY_WIDTH - KEY_GAP,
    WHITE_KEY_HEIGHT,
    WHITE_KEY_LENGTH
  );
}

/**
 * Create black key geometry with beveled front edge.
 * Real black keys have an angled chamfer on the front that slopes down toward the player.
 * Front of key (toward player) is at +Z, back is at -Z.
 */
export function createBlackKeyGeometry(): THREE.BufferGeometry {
  const w = BLACK_KEY_WIDTH / 2;   // half width
  const h = BLACK_KEY_HEIGHT;
  const l = BLACK_KEY_LENGTH / 2;  // half length
  const bevelDepth = l * 0.25;     // how far back the bevel extends (25% of length)
  const bevelDrop = h * 0.35;      // how much the front drops down

  // Black key profile from side (player at right):
  //    |___________
  //    |           \   <- flat top, then bevel down toward player
  //    |            \
  //    |_____________|
  //                 ^-- angled front bevel (player side)

  const vertices = new Float32Array([
    // Back bottom edge (away from player)
    -w, 0, -l,                     // 0: back-bottom-left
     w, 0, -l,                     // 1: back-bottom-right

    // Back top edge
    -w, h, -l,                     // 2: back-top-left
     w, h, -l,                     // 3: back-top-right

    // Where bevel starts (still at full height)
    -w, h, l - bevelDepth,         // 4: bevel-start-left
     w, h, l - bevelDepth,         // 5: bevel-start-right

    // Front top edge (lowered due to bevel, toward player)
    -w, h - bevelDrop, l,          // 6: front-top-left
     w, h - bevelDrop, l,          // 7: front-top-right

    // Front bottom edge (toward player)
    -w, 0, l,                      // 8: front-bottom-left
     w, 0, l,                      // 9: front-bottom-right
  ]);

  const indices = new Uint16Array([
    // Back face
    0, 1, 3,  0, 3, 2,

    // Top face (flat part)
    2, 3, 5,  2, 5, 4,

    // Bevel face (angled slope toward player)
    4, 5, 7,  4, 7, 6,

    // Front face (below bevel)
    6, 7, 9,  6, 9, 8,

    // Bottom face
    0, 9, 1,  0, 8, 9,

    // Left face
    0, 2, 4,  0, 4, 6,  0, 6, 8,

    // Right face
    1, 9, 7,  1, 7, 5,  1, 5, 3,
  ]);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeVertexNormals();

  return geometry;
}
