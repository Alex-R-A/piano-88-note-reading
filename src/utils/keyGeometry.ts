// utils/keyGeometry.ts
import * as THREE from 'three';

// Key dimensions (relative units). Ratios follow a real keyboard: an octave
// spans 7 white keys, a white key is ~23.5mm wide, a black key ~13.7mm.
export const WHITE_KEY_WIDTH = 1;
const WHITE_KEY_LENGTH = 5;
export const WHITE_KEY_HEIGHT = 0.62;
const BLACK_KEY_WIDTH = 0.58;
const BLACK_KEY_LENGTH = 3;
const BLACK_KEY_HEIGHT = 0.52;

// Gap between adjacent keys.
const KEY_GAP = 0.045;

// Front section of a white key, ahead of the black keys, at full width.
const WHITE_KEY_HEAD_LENGTH =
  WHITE_KEY_LENGTH - BLACK_KEY_LENGTH - KEY_GAP;

// Black keys sit on top of the white keys, back edges flush.
export const BLACK_KEY_Z = -(WHITE_KEY_LENGTH - BLACK_KEY_LENGTH) / 2;

// Edge rounding. Small enough to read as a chamfer, not a rounded box.
const WHITE_BEVEL = 0.018;
const BLACK_BEVEL = 0.022;

// Black keys are slightly narrower at the top than at the base.
const BLACK_TOP_WIDTH_RATIO = 0.86;
// The top surface slopes down toward the player over the last stretch.
const BLACK_SLOPE_LENGTH = BLACK_KEY_LENGTH * 0.12;
const BLACK_SLOPE_DROP = BLACK_KEY_HEIGHT * 0.26;

const HALF_WHITE = (WHITE_KEY_WIDTH - KEY_GAP) / 2;

/**
 * White key index that each black key straddles the right-hand edge of.
 * C#=0, D#=1, F#=3, G#=4, A#=5.
 */
const BLACK_KEY_WHITE_INDEX = [0, 1, 3, 4, 5];

/**
 * Black key centres, in white-key widths measured from the left edge of C.
 *
 * Black keys are not centred on the boundary between two white keys. They are
 * placed so that every white key tail within a group (C-D-E, then F-G-A-B) has
 * the same width, which pushes C#/F# left and D#/A# right. Only G# lands on the
 * boundary.
 */
function blackKeyCentersForGroup(
  groupStartX: number,
  whiteKeyCount: number
): number[] {
  const tailWidth =
    (whiteKeyCount - (whiteKeyCount - 1) * BLACK_KEY_WIDTH) / whiteKeyCount;
  return Array.from(
    { length: whiteKeyCount - 1 },
    (_, i) =>
      groupStartX + (i + 1) * tailWidth + (i + 0.5) * BLACK_KEY_WIDTH
  );
}

export const BLACK_KEY_CENTERS: number[] = [
  ...blackKeyCentersForGroup(0, 3),
  ...blackKeyCentersForGroup(3, 4),
];

export interface WhiteKeyShape {
  /** Left edge of the narrow tail, relative to the key's centre. */
  tailLeftX: number;
  /** Right edge of the narrow tail, relative to the key's centre. */
  tailRightX: number;
}

/**
 * Tail bounds for each of the seven white keys, cut back by whichever black
 * keys overlap them. C and F are uncut on the left, E and B on the right.
 */
export const WHITE_KEY_SHAPES: WhiteKeyShape[] = Array.from(
  { length: 7 },
  (_, index) => {
    const centerX = index + 0.5;
    const leftBlack = BLACK_KEY_CENTERS.find(
      (_c, b) => BLACK_KEY_WHITE_INDEX[b] === index - 1
    );
    const rightBlack = BLACK_KEY_CENTERS.find(
      (_c, b) => BLACK_KEY_WHITE_INDEX[b] === index
    );
    const clearance = BLACK_KEY_WIDTH / 2 + KEY_GAP / 2;
    return {
      tailLeftX:
        leftBlack === undefined
          ? -HALF_WHITE
          : Math.max(leftBlack + clearance - centerX, -HALF_WHITE),
      tailRightX:
        rightBlack === undefined
          ? HALF_WHITE
          : Math.min(rightBlack - clearance - centerX, HALF_WHITE),
    };
  }
);

/**
 * Extrude a top-down outline upward into a solid, with a chamfered perimeter.
 *
 * The shape is drawn in XY with +y running from the front of the key toward the
 * back; extrusion runs along +z. Rotating -90 degrees about X maps that to a
 * solid standing on y=0 with its front face toward +z.
 */
function extrudeUpward(
  shape: THREE.Shape,
  height: number,
  bevel: number,
  length: number
): THREE.ExtrudeGeometry {
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height - 2 * bevel,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: 0,
    bevelSegments: 2,
    steps: 1,
  });
  // Extrusion spans [-bevel, height - bevel]; lift it so the key rests on y=0.
  geometry.translate(0, 0, bevel);
  geometry.rotateX(-Math.PI / 2);
  // The outline ran back-to-front along +y, which is now -z; recentre on z=0.
  geometry.translate(0, 0, length / 2);
  return geometry;
}

/**
 * Create white key geometry: a full-width head at the front and a narrow tail
 * running back between the black keys.
 *
 *      back
 *   +--+  +--+     tail, cut by the neighbouring black keys
 *   |  |  |  |
 *   |  +--+  |
 *   |        |
 *   +--------+     head, full width
 *      front
 */
export function createWhiteKeyGeometry({
  tailLeftX,
  tailRightX,
}: WhiteKeyShape): THREE.ExtrudeGeometry {
  const head = WHITE_KEY_HEAD_LENGTH;
  const back = WHITE_KEY_LENGTH;
  const epsilon = 1e-6;

  const shape = new THREE.Shape();
  shape.moveTo(-HALF_WHITE, 0);
  shape.lineTo(HALF_WHITE, 0);
  shape.lineTo(HALF_WHITE, head);
  // Skip the notch corner when the tail runs flush to the head edge (E and B),
  // which would otherwise emit a zero-length edge.
  if (tailRightX < HALF_WHITE - epsilon) {
    shape.lineTo(tailRightX, head);
  }
  shape.lineTo(tailRightX, back);
  shape.lineTo(tailLeftX, back);
  if (tailLeftX > -HALF_WHITE + epsilon) {
    shape.lineTo(tailLeftX, head);
  }
  shape.lineTo(-HALF_WHITE, head);
  shape.closePath();

  return extrudeUpward(shape, WHITE_KEY_HEIGHT, WHITE_BEVEL, WHITE_KEY_LENGTH);
}

/**
 * Create black key geometry: a chamfered wedge that tapers inward toward the
 * top and slopes down at the front.
 *
 * Side view, player to the right:
 *   +-----------\    flat top, then the front slope
 *   |            |
 *   +------------+
 */
export function createBlackKeyGeometry(): THREE.BufferGeometry {
  const halfLength = BLACK_KEY_LENGTH / 2;
  const height = BLACK_KEY_HEIGHT;

  // Side profile in XY: x is depth (front at +x), y is height.
  const profile = new THREE.Shape();
  profile.moveTo(-halfLength, 0);
  profile.lineTo(halfLength, 0);
  profile.lineTo(halfLength, height - BLACK_SLOPE_DROP);
  profile.lineTo(halfLength - BLACK_SLOPE_LENGTH, height);
  profile.lineTo(-halfLength, height);
  profile.closePath();

  const geometry = new THREE.ExtrudeGeometry(profile, {
    depth: BLACK_KEY_WIDTH - 2 * BLACK_BEVEL,
    bevelEnabled: true,
    bevelThickness: BLACK_BEVEL,
    bevelSize: BLACK_BEVEL,
    bevelOffset: 0,
    bevelSegments: 2,
    steps: 1,
  });

  // Extruded across [-bevel, width - bevel]; centre it on the extrusion axis.
  geometry.translate(0, 0, BLACK_BEVEL - BLACK_KEY_WIDTH / 2);
  // Map profile-x to depth (+z) and the extrusion axis to width (x).
  geometry.rotateY(-Math.PI / 2);

  // Narrow the key toward its top. Applied after extrusion so the chamfer and
  // the taper compose instead of fighting each other.
  const position = geometry.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < position.count; i++) {
    const t = THREE.MathUtils.clamp(position.getY(i) / height, 0, 1);
    const scale = 1 + (BLACK_TOP_WIDTH_RATIO - 1) * t;
    position.setX(i, position.getX(i) * scale);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();

  return geometry;
}
