// components/LessonScreen/FeedbackOverlay.tsx
import { useEffect, useMemo, useState } from 'react';
import type { FeedbackState } from '@/types';

/**
 * Answer feedback. A correct answer needs no fanfare: the lesson advancing
 * to the next note is the confirmation. A wrong answer raises the concert
 * hall against you: a scatter of "Boo!"s floats up from behind the keyboard,
 * drifting and fading out toward the top of the page.
 *
 * The old full-screen green/red washes are gone; over hundreds of answers
 * they strobed the whole page and were hard on the eyes.
 *
 * The overlay always renders and exposes data-feedback so tests can observe
 * the answer state without depending on visuals.
 */
interface FeedbackOverlayProps {
  feedbackState: FeedbackState;
}

const BOO_COUNT = 10;
const BOO_LIFETIME_MS = 1900; // longest duration + delay, with margin

interface Boo {
  left: number;
  bottom: number;
  size: number;
  delay: number;
  duration: number;
  tilt: number;
  drift: number;
}

function makeBoos(): Boo[] {
  return Array.from({ length: BOO_COUNT }, () => ({
    left: 8 + Math.random() * 84, // % across the page
    bottom: 12 + Math.random() * 18, // % up the page: around the keyboard base
    size: 34 + Math.random() * 38,
    delay: Math.random() * 350,
    duration: 950 + Math.random() * 500,
    tilt: -14 + Math.random() * 28,
    drift: -40 + Math.random() * 80,
  }));
}

export function FeedbackOverlay({ feedbackState }: FeedbackOverlayProps) {
  // Each transition into 'incorrect' launches a fresh wave; the counter keys
  // the spans so consecutive mistakes each get their own animation.
  const [wave, setWave] = useState(0);

  useEffect(() => {
    if (feedbackState === 'incorrect') {
      setWave((w) => w + 1);
    }
  }, [feedbackState]);

  // Remove the finished wave so stale spans do not accumulate.
  useEffect(() => {
    if (wave === 0) return;
    const timer = setTimeout(() => setWave(0), BOO_LIFETIME_MS);
    return () => clearTimeout(timer);
  }, [wave]);

  const boos = useMemo(() => (wave > 0 ? makeBoos() : []), [wave]);

  return (
    // The swarm flies in front of the page content: behind it, the staff and
    // keyboard hid most of the boos and the effect read as stray glyphs. It
    // is pointer-events-none, so nothing underneath is blocked.
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 40 }}
      data-testid="feedback-overlay"
      data-feedback={feedbackState}
      aria-hidden="true"
    >
      {boos.map((boo, i) => (
        <span
          key={`${wave}-${i}`}
          className="absolute font-display font-semibold text-felt-600"
          style={{
            left: `${boo.left}%`,
            bottom: `${boo.bottom}%`,
            fontSize: `${boo.size}px`,
            ['--boo-drift' as string]: `${boo.drift}px`,
            animation: `boo-rise ${boo.duration}ms ease-in ${boo.delay}ms both`,
          }}
        >
          <span style={{ display: 'inline-block', transform: `rotate(${boo.tilt}deg)` }}>
            Boo!
          </span>
        </span>
      ))}
    </div>
  );
}
