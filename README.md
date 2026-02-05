# Piano 88 Key Note Learning

A browser-based app that teaches beginners to read musical staff notation and identify the corresponding keys on an 88-key piano. You see a note on the staff, then click the correct key on a 3D piano keyboard.

## What It Does

The app presents notes on a musical staff (treble and bass clef) and asks you to identify which piano key matches. It uses spaced repetition to show you missed notes more often, helping build the mental connection between written notation and physical key positions.

**Three screens guide the experience:**

**Start Screen** configures your lesson. Select which octaves to practice (0 through 8), toggle sharps and flats, enable audio feedback, and choose whether to reveal the correct answer after mistakes. A visual overview of all 88 keys shows which octaves you've selected.

**Lesson Screen** is the core learning loop. A note appears on the staff with the appropriate clef, and you click the matching key on a 3D single-octave keyboard. Correct answers flash green, wrong answers flash red. Audio plays the note when enabled. The algorithm avoids repeating the same note within a 4-note window and cycles through all selected notes before repeating.

**Stats Screen** shows your session results sorted worst-to-best, with per-note accuracy, color-coded rows, and an overall accuracy percentage.

## Getting Started

Requires Node.js 22+.

```
pnpm install
pnpm dev
```

Open the URL printed by the dev server (typically `http://localhost:5173`).

## Build

```
pnpm build
pnpm preview
```

## Test

```
pnpm test
pnpm e2e
```

## Tech Stack

React 18, TypeScript, Vite, Tailwind CSS, React Three Fiber (3D keyboard), VexFlow (staff notation), smplr (piano audio), Zustand (state), Vitest + Playwright (testing).
