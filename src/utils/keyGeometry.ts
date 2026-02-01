// utils/keyGeometry.ts
import * as THREE from 'three';
import type { WhiteKeyProfile } from '@/types';

// Key dimensions (relative units)
export const WHITE_KEY_WIDTH = 1;
export const WHITE_KEY_LENGTH = 5;
export const WHITE_KEY_HEIGHT = 0.5;
export const BLACK_KEY_WIDTH = 0.6;
export const BLACK_KEY_LENGTH = 3; // Sits at back 60% of white key
export const BLACK_KEY_HEIGHT = 0.5;

// Notch dimensions: where black keys nestle between white keys
const NOTCH_DEPTH = BLACK_KEY_LENGTH; // How far back the notch extends (Z direction)
const NOTCH_WIDTH = BLACK_KEY_WIDTH / 2 + 0.05; // Half black key width + small gap
const NOTCH_HEIGHT = BLACK_KEY_HEIGHT; // Height of the notch (cut from top surface)

/**
 * Create white key geometry with notches cut from the TOP surface at the BACK.
 *
 * The key is a box (WIDTH x HEIGHT x LENGTH) with rectangular notches cut from
 * the top-rear corners where black keys sit between white keys.
 *
 * Coordinate system:
 * - X: left/right (key width)
 * - Y: up/down (key height)
 * - Z: front/back (key length, positive Z = back)
 *
 * Type 1 (C, F): notch on right-back corner
 * Type 2 (D, G, A): notches on both back corners
 * Type 3 (E, B): notch on left-back corner
 */
export function createWhiteKeyGeometry(
  profile: WhiteKeyProfile
): THREE.BufferGeometry {
  const hw = WHITE_KEY_WIDTH / 2; // Half width
  const h = WHITE_KEY_HEIGHT;
  const l = WHITE_KEY_LENGTH;
  const nd = NOTCH_DEPTH; // Notch depth (Z)
  const nw = NOTCH_WIDTH; // Notch width (X)
  const nh = NOTCH_HEIGHT; // Notch height (Y, cut from top)

  const hasLeftNotch = profile === 'type2' || profile === 'type3';
  const hasRightNotch = profile === 'type2' || profile === 'type1';

  // Build the geometry using indexed BufferGeometry
  // The key shape is a box with 0-2 rectangular notches cut from top-back

  const vertices: number[] = [];
  const indices: number[] = [];

  // Helper to add a vertex and return its index
  let vertexIndex = 0;
  const addVertex = (x: number, y: number, z: number): number => {
    vertices.push(x, y, z);
    return vertexIndex++;
  };

  // Helper to add a quad (two triangles) given 4 vertex indices
  // Vertices should be in counter-clockwise order when viewed from outside
  const addQuad = (a: number, b: number, c: number, d: number) => {
    indices.push(a, b, c); // First triangle
    indices.push(a, c, d); // Second triangle
  };

  // Define the key as a combination of boxes
  // For simplicity, we'll create the geometry by defining each face explicitly

  // The key has these regions:
  // 1. Front section: full width, full height, from z=0 to z=(l-nd)
  // 2. Back section(s): depends on notch configuration

  const frontZ = l - nd; // Where front section ends and back section begins
  const lowTopY = h - nh; // Y height of the lowered top surface (in notch areas)

  // === BOTTOM FACE (Y = 0) ===
  // Full rectangle on bottom
  const b0 = addVertex(-hw, 0, 0);     // front-left
  const b1 = addVertex(hw, 0, 0);      // front-right
  const b2 = addVertex(hw, 0, l);      // back-right
  const b3 = addVertex(-hw, 0, l);     // back-left
  addQuad(b0, b1, b2, b3);

  // === FRONT FACE (Z = 0) ===
  const f0 = addVertex(-hw, 0, 0);     // bottom-left
  const f1 = addVertex(hw, 0, 0);      // bottom-right
  const f2 = addVertex(hw, h, 0);      // top-right
  const f3 = addVertex(-hw, h, 0);     // top-left
  addQuad(f1, f0, f3, f2); // Reversed order for outward normal

  // === BACK FACE (Z = l) ===
  // Back face has varying height depending on notches
  if (hasLeftNotch && hasRightNotch) {
    // Both notches: entire back is at lowered height
    const bk0 = addVertex(-hw, 0, l);
    const bk1 = addVertex(hw, 0, l);
    const bk2 = addVertex(hw, lowTopY, l);
    const bk3 = addVertex(-hw, lowTopY, l);
    addQuad(bk0, bk1, bk2, bk3);
  } else if (hasLeftNotch) {
    // Left notch only: left side lowered, right side full height
    // Left portion (lowered)
    const bk0 = addVertex(-hw, 0, l);
    const bk1 = addVertex(hw - nw, 0, l);
    const bk2 = addVertex(hw - nw, lowTopY, l);
    const bk3 = addVertex(-hw, lowTopY, l);
    addQuad(bk0, bk1, bk2, bk3);
    // Right portion (full height)
    const bk4 = addVertex(hw - nw, 0, l);
    const bk5 = addVertex(hw, 0, l);
    const bk6 = addVertex(hw, h, l);
    const bk7 = addVertex(hw - nw, h, l);
    addQuad(bk4, bk5, bk6, bk7);
    // Note: The vertical step at the back face transition (at x = hw - nw)
    // is part of the inner notch wall, which is covered in the TOP SURFACE section
  } else if (hasRightNotch) {
    // Right notch only: right side lowered, left side full height
    // Left portion (full height)
    const bk0 = addVertex(-hw, 0, l);
    const bk1 = addVertex(-hw + nw, 0, l);
    const bk2 = addVertex(-hw + nw, h, l);
    const bk3 = addVertex(-hw, h, l);
    addQuad(bk0, bk1, bk2, bk3);
    // Right portion (lowered)
    const bk4 = addVertex(-hw + nw, 0, l);
    const bk5 = addVertex(hw, 0, l);
    const bk6 = addVertex(hw, lowTopY, l);
    const bk7 = addVertex(-hw + nw, lowTopY, l);
    addQuad(bk4, bk5, bk6, bk7);
  } else {
    // No notches: full height back face
    const bk0 = addVertex(-hw, 0, l);
    const bk1 = addVertex(hw, 0, l);
    const bk2 = addVertex(hw, h, l);
    const bk3 = addVertex(-hw, h, l);
    addQuad(bk0, bk1, bk2, bk3);
  }

  // === LEFT SIDE FACE (X = -hw) ===
  if (hasLeftNotch) {
    // Front portion: full height from z=0 to z=frontZ
    const ls0 = addVertex(-hw, 0, 0);
    const ls1 = addVertex(-hw, 0, frontZ);
    const ls2 = addVertex(-hw, h, frontZ);
    const ls3 = addVertex(-hw, h, 0);
    addQuad(ls0, ls1, ls2, ls3);
    // Back portion: lowered height from z=frontZ to z=l
    const ls4 = addVertex(-hw, 0, frontZ);
    const ls5 = addVertex(-hw, 0, l);
    const ls6 = addVertex(-hw, lowTopY, l);
    const ls7 = addVertex(-hw, lowTopY, frontZ);
    addQuad(ls4, ls5, ls6, ls7);
  } else {
    // No left notch: full height all the way
    const ls0 = addVertex(-hw, 0, 0);
    const ls1 = addVertex(-hw, 0, l);
    const ls2 = addVertex(-hw, h, l);
    const ls3 = addVertex(-hw, h, 0);
    addQuad(ls0, ls1, ls2, ls3);
  }

  // === RIGHT SIDE FACE (X = hw) ===
  if (hasRightNotch) {
    // Front portion: full height from z=0 to z=frontZ
    const rs0 = addVertex(hw, 0, frontZ);
    const rs1 = addVertex(hw, 0, 0);
    const rs2 = addVertex(hw, h, 0);
    const rs3 = addVertex(hw, h, frontZ);
    addQuad(rs0, rs1, rs2, rs3);
    // Back portion: lowered height from z=frontZ to z=l
    const rs4 = addVertex(hw, 0, l);
    const rs5 = addVertex(hw, 0, frontZ);
    const rs6 = addVertex(hw, lowTopY, frontZ);
    const rs7 = addVertex(hw, lowTopY, l);
    addQuad(rs4, rs5, rs6, rs7);
  } else {
    // No right notch: full height all the way
    const rs0 = addVertex(hw, 0, l);
    const rs1 = addVertex(hw, 0, 0);
    const rs2 = addVertex(hw, h, 0);
    const rs3 = addVertex(hw, h, l);
    addQuad(rs0, rs1, rs2, rs3);
  }

  // === TOP SURFACE ===
  // The top surface is complex due to notches. Break it into regions.

  if (!hasLeftNotch && !hasRightNotch) {
    // No notches: simple full rectangle on top
    const t0 = addVertex(-hw, h, 0);
    const t1 = addVertex(hw, h, 0);
    const t2 = addVertex(hw, h, l);
    const t3 = addVertex(-hw, h, l);
    addQuad(t0, t1, t2, t3);
  } else if (hasLeftNotch && hasRightNotch) {
    // Both notches (Type 2: D, G, A)
    // Front full-height section
    const t0 = addVertex(-hw, h, 0);
    const t1 = addVertex(hw, h, 0);
    const t2 = addVertex(hw, h, frontZ);
    const t3 = addVertex(-hw, h, frontZ);
    addQuad(t0, t1, t2, t3);
    // Back lowered section (notch floor)
    const t4 = addVertex(-hw, lowTopY, frontZ);
    const t5 = addVertex(hw, lowTopY, frontZ);
    const t6 = addVertex(hw, lowTopY, l);
    const t7 = addVertex(-hw, lowTopY, l);
    addQuad(t4, t5, t6, t7);
    // Step face (vertical wall where notch starts) - facing back (+Z)
    const st0 = addVertex(-hw, lowTopY, frontZ);
    const st1 = addVertex(-hw, h, frontZ);
    const st2 = addVertex(hw, h, frontZ);
    const st3 = addVertex(hw, lowTopY, frontZ);
    addQuad(st0, st1, st2, st3);
  } else if (hasLeftNotch) {
    // Left notch only (Type 3: E, B)
    // Full-height front section
    const t0 = addVertex(-hw, h, 0);
    const t1 = addVertex(hw, h, 0);
    const t2 = addVertex(hw, h, frontZ);
    const t3 = addVertex(-hw, h, frontZ);
    addQuad(t0, t1, t2, t3);
    // Full-height right back section (no notch on right)
    const t4 = addVertex(hw - nw, h, frontZ);
    const t5 = addVertex(hw, h, frontZ);
    const t6 = addVertex(hw, h, l);
    const t7 = addVertex(hw - nw, h, l);
    addQuad(t4, t5, t6, t7);
    // Lowered left back section (notch floor)
    const t8 = addVertex(-hw, lowTopY, frontZ);
    const t9 = addVertex(hw - nw, lowTopY, frontZ);
    const t10 = addVertex(hw - nw, lowTopY, l);
    const t11 = addVertex(-hw, lowTopY, l);
    addQuad(t8, t9, t10, t11);
    // Step face (left notch wall facing back)
    const st0 = addVertex(-hw, lowTopY, frontZ);
    const st1 = addVertex(-hw, h, frontZ);
    const st2 = addVertex(hw - nw, h, frontZ);
    const st3 = addVertex(hw - nw, lowTopY, frontZ);
    addQuad(st0, st1, st2, st3);
    // Inner wall of left notch (at x = hw - nw, facing left, from frontZ to l)
    const iw0 = addVertex(hw - nw, lowTopY, frontZ);
    const iw1 = addVertex(hw - nw, lowTopY, l);
    const iw2 = addVertex(hw - nw, h, l);
    const iw3 = addVertex(hw - nw, h, frontZ);
    addQuad(iw0, iw1, iw2, iw3);
  } else if (hasRightNotch) {
    // Right notch only (Type 1: C, F)
    // Full-height front section
    const t0 = addVertex(-hw, h, 0);
    const t1 = addVertex(hw, h, 0);
    const t2 = addVertex(hw, h, frontZ);
    const t3 = addVertex(-hw, h, frontZ);
    addQuad(t0, t1, t2, t3);
    // Full-height left back section (no notch on left)
    const t4 = addVertex(-hw, h, frontZ);
    const t5 = addVertex(-hw + nw, h, frontZ);
    const t6 = addVertex(-hw + nw, h, l);
    const t7 = addVertex(-hw, h, l);
    addQuad(t4, t5, t6, t7);
    // Lowered right back section (notch floor)
    const t8 = addVertex(-hw + nw, lowTopY, frontZ);
    const t9 = addVertex(hw, lowTopY, frontZ);
    const t10 = addVertex(hw, lowTopY, l);
    const t11 = addVertex(-hw + nw, lowTopY, l);
    addQuad(t8, t9, t10, t11);
    // Step face (right notch wall facing back)
    const st0 = addVertex(-hw + nw, lowTopY, frontZ);
    const st1 = addVertex(-hw + nw, h, frontZ);
    const st2 = addVertex(hw, h, frontZ);
    const st3 = addVertex(hw, lowTopY, frontZ);
    addQuad(st0, st1, st2, st3);
    // Inner wall of right notch (at x = -hw + nw, facing right, from frontZ to l)
    const iw0 = addVertex(-hw + nw, lowTopY, l);
    const iw1 = addVertex(-hw + nw, lowTopY, frontZ);
    const iw2 = addVertex(-hw + nw, h, frontZ);
    const iw3 = addVertex(-hw + nw, h, l);
    addQuad(iw0, iw1, iw2, iw3);
  }

  // Create the geometry
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(vertices, 3)
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  // Center the geometry: translate so center is at origin
  // Currently: X centered, Y from 0 to h, Z from 0 to l
  // Move to: Y centered (from -h/2 to h/2), Z centered (from -l/2 to l/2)
  geometry.translate(0, -h / 2, -l / 2);

  return geometry;
}

/**
 * Create black key geometry (simple box).
 */
export function createBlackKeyGeometry(): THREE.BoxGeometry {
  return new THREE.BoxGeometry(
    BLACK_KEY_WIDTH,
    BLACK_KEY_HEIGHT,
    BLACK_KEY_LENGTH
  );
}
