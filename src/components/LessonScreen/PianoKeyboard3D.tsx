// components/LessonScreen/PianoKeyboard3D.tsx
import { Canvas } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer } from '@react-three/drei';
import { useMemo } from 'react';
import { WhiteKey } from './WhiteKey';
import { BlackKey } from './BlackKey';
import { WebGLErrorBoundary } from '@/components/ui';
import {
  WHITE_KEY_WIDTH,
  WHITE_KEY_HEIGHT,
  WHITE_KEY_SHAPES,
  BLACK_KEY_CENTERS,
  BLACK_KEY_Z,
} from '@/utils/keyGeometry';
import { areEnharmonic } from '@/utils/noteUtils';
import type { PitchClass, NoteLetter } from '@/types';

interface PianoKeyboard3DProps {
  onKeyClick: (pitchClass: PitchClass) => void;
  highlightedKey: PitchClass | null;
  /** When false, keys ignore the pointer entirely (between questions). */
  interactive: boolean;
}

const WHITE_KEYS: NoteLetter[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

// Ordered to match BLACK_KEY_CENTERS.
const BLACK_KEYS: PitchClass[] = ['C#', 'D#', 'F#', 'G#', 'A#'];

function isKeyHighlighted(
  keyPitchClass: PitchClass,
  highlightedKey: PitchClass | null
): boolean {
  if (!highlightedKey) return false;
  return areEnharmonic(keyPitchClass, highlightedKey);
}

function KeyboardScene({
  onKeyClick,
  highlightedKey,
  interactive,
}: PianoKeyboard3DProps) {
  // Layout runs left to right from the left edge of C; shift so the octave
  // straddles the origin.
  const centerShift = (WHITE_KEYS.length * WHITE_KEY_WIDTH) / 2;

  const whiteKeyPositions = useMemo(() => {
    return WHITE_KEYS.map((letter, index) => ({
      letter,
      pitchClass: letter as PitchClass,
      shape: WHITE_KEY_SHAPES[index],
      position: [
        (index + 0.5) * WHITE_KEY_WIDTH - centerShift,
        0,
        0,
      ] as [number, number, number],
    }));
  }, [centerShift]);

  const blackKeyPositions = useMemo(() => {
    return BLACK_KEYS.map((pitchClass, index) => ({
      pitchClass,
      position: [
        BLACK_KEY_CENTERS[index] - centerShift,
        WHITE_KEY_HEIGHT,
        BLACK_KEY_Z,
      ] as [number, number, number],
    }));
  }, [centerShift]);

  return (
    <>
      {/* A small studio built from emissive panels, baked once into an
          environment map. Direct lights alone give the gloss coat a single
          blown highlight; this is what makes the ebony grade from dark at
          grazing angles to lit near the horizon, like real lacquer. */}
      <Environment resolution={64} frames={1}>
        <color attach="background" args={['#20202a']} />
        {/* Broad overhead softbox. */}
        <Lightformer
          form="rect"
          intensity={3}
          color="#ffffff"
          position={[0, 6, 1]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[12, 8, 1]}
        />
        {/* Warm side panel, matching the key light. */}
        <Lightformer
          form="rect"
          intensity={1.6}
          color="#fff4e2"
          position={[-7, 3, 4]}
          rotation={[0, Math.PI / 2.4, 0]}
          scale={[8, 5, 1]}
        />
        {/* Cool bounce from the far side keeps the shadow side from dying. */}
        <Lightformer
          form="rect"
          intensity={0.8}
          color="#dfe6ff"
          position={[7, 2, 2]}
          rotation={[0, -Math.PI / 2.4, 0]}
          scale={[8, 5, 1]}
        />
      </Environment>

      {/* Soft room bounce: bright from above, dimmer from the keybed below. */}
      <hemisphereLight args={['#ffffff', '#5d5c58', 0.35]} />

      {/* Key light, front-left and high, casting the black keys onto the
          white key tails. That shadow is the main depth cue at this angle. */}
      <directionalLight
        position={[-7, 16, 8]}
        intensity={2.4}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-camera-near={1}
        shadow-camera-far={40}
        shadow-bias={-0.0006}
        shadow-normalBias={0.015}
      />

      {/* Fill from the opposite side, no shadow, to keep the gaps from
          crushing to solid black. */}
      <directionalLight position={[9, 5, 4]} intensity={0.55} />

      {/* Low rim light from behind, which picks out the top edge chamfers. */}
      <directionalLight position={[0, 4, -10]} intensity={0.35} />

      {/* Grounding shadow: a soft pool directly beneath the instrument.
          The key light is too steep for its cast shadow to escape the
          keyboard's footprint, so without this the keys read as floating.
          ContactShadows stays independent of the light rig, spreads around
          the footprint, and follows keys as they sink when pressed. */}
      <ContactShadows
        position={[0, -0.01, 0]}
        opacity={0.5}
        scale={14}
        blur={2.4}
        far={2}
        resolution={512}
        color="#3a3430"
      />

      {whiteKeyPositions.map(({ letter, pitchClass, shape, position }) => (
        <WhiteKey
          key={letter}
          letter={letter}
          shape={shape}
          position={position}
          onClick={() => onKeyClick(pitchClass)}
          isHighlighted={isKeyHighlighted(pitchClass, highlightedKey)}
          interactive={interactive}
        />
      ))}

      {blackKeyPositions.map(({ pitchClass, position }) => (
        <BlackKey
          key={pitchClass}
          pitchClass={pitchClass}
          position={position}
          onClick={() => onKeyClick(pitchClass)}
          isHighlighted={isKeyHighlighted(pitchClass, highlightedKey)}
          interactive={interactive}
        />
      ))}
    </>
  );
}

export function PianoKeyboard3D({
  onKeyClick,
  highlightedKey,
  interactive,
}: PianoKeyboard3DProps) {
  return (
    // Sized by height with a locked 3:1 aspect, so the instrument scales to the
    // viewport instead of forcing a fixed 1800px that overflowed every display
    // narrower than that and pushed the stop button below the fold. The camera
    // has a fixed vertical fov, so scaling the canvas proportionally scales the
    // whole scene rather than cropping it.
    <div
      className="rounded-lg overflow-hidden mx-auto"
      style={{
        height: 'min(600px, 42vh)',
        aspectRatio: '3 / 1',
        maxWidth: '100%',
      }}
    >
      <WebGLErrorBoundary>
        <Canvas
          shadows="soft"
          camera={{
            position: [0, 9, 18],
            fov: 14,
          }}
          gl={{ antialias: true, alpha: true }}
          scene={{ background: null }}
          onCreated={({ camera }) => {
            camera.lookAt(0, 0, 0);
          }}
        >
          <KeyboardScene
            onKeyClick={onKeyClick}
            highlightedKey={highlightedKey}
            interactive={interactive}
          />
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  );
}
