# Piano Note Learning Application

## Project Overview

A browser-based React application that teaches users to read musical staff notation and map notes to their corresponding piano keys. The application presents notes on a musical staff and requires users to identify the correct key on a visual 3D piano keyboard.

**Target User**: Beginner piano learners who need to build the mental connection between written notation and physical key positions.

**Core Learning Goal**: User sees a note on the staff → User identifies which piano key that note corresponds to.

---

## Terminology Reference

For implementation consistency:

| Term | Definition |
|------|------------|
| **Pitch Class** | The letter name of a note regardless of octave (C, D, E, F, G, A, B) |
| **Accidental** | Sharp (#) or flat (b) modifier on a note |
| **Enharmonic** | Two note names for the same key (F# and Gb are enharmonic equivalents) |
| **Octave** | A range of 12 semitones; on piano, octaves are numbered 0-8 |
| **Middle C** | C4, the C nearest the center of an 88-key piano |
| **Treble Clef** | G clef, used for higher-pitched notes (typically C4 and above) |
| **Bass Clef** | F clef, used for lower-pitched notes (typically below C4) |
| **Leger Lines** | Short horizontal lines above or below the staff for notes outside the 5 main lines |
| **Staff** | The 5 horizontal lines on which notes are placed |
| **NoteId** | String identifier format: letter + accidental + octave, e.g., "C#4", "Bb3", "G5" |

---

## Piano Layout Reference

### 88-Key Piano Structure

```
Octave 0 (partial):  A0, Bb0, B0                    [3 notes]
Octave 1 (full):     C1, C#1, D1... through B1      [12 notes]
Octave 2 (full):     C2, C#2, D2... through B2      [12 notes]
Octave 3 (full):     C3, C#3, D3... through B3      [12 notes]
Octave 4 (full):     C4 (middle C), C#4... through B4  [12 notes]
Octave 5 (full):     C5, C#5, D5... through B5      [12 notes]
Octave 6 (full):     C6, C#6, D6... through B6      [12 notes]
Octave 7 (full):     C7, C#7, D7... through B7      [12 notes]
Octave 8 (partial):  C8                             [1 note]

Total: 88 keys (52 white, 36 black)
```

### Notes Per Octave (Full Octave)

Natural notes (white keys): C, D, E, F, G, A, B (7 notes)
Accidentals (black keys): C#/Db, D#/Eb, F#/Gb, G#/Ab, A#/Bb (5 notes)

When sharps/flats enabled, each black key generates TWO note items (sharp and flat spelling).

### White Key Shapes

White keys have notches where black keys sit between them:

```
Key C: notch on RIGHT only (black key C#/Db to its right)
Key D: notches on BOTH sides (between C#/Db and D#/Eb)
Key E: notch on LEFT only (black key D#/Eb to its left)
Key F: notch on RIGHT only (black key F#/Gb to its right)
Key G: notches on BOTH sides (between F#/Gb and G#/Ab)
Key A: notches on BOTH sides (between G#/Ab and A#/Bb)
Key B: notch on LEFT only (black key A#/Bb to its left)
```

This creates 3 distinct white key profiles:
- **Type 1** (C, F): Rectangle with notch cut from top-right
- **Type 2** (D, G, A): Rectangle with notches cut from both top corners
- **Type 3** (E, B): Rectangle with notch cut from top-left

Black keys are uniform raised rectangles.

---

## Screen Specifications

### Screen Flow

```
┌──────────────┐      ┌───────────────┐      ┌──────────────────┐
│ Main Screen  │ ──→  │ Lesson Screen │ ──→  │ Analytics Screen │
│ (Settings)   │      │ (Quiz)        │      │ (Results)        │
└──────────────┘      └───────────────┘      └──────────────────┘
                              │                        │
                              └────────────────────────┘
                                    (back to main)
```

---

### Main Screen

#### Purpose
Configure lesson parameters: which octaves to practice, whether to include accidentals, audio settings.

#### Visual Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐       │
│  │ Oct │ Oct │ Oct │ Oct │ Oct │ Oct │ Oct │ Oct │ Oct │       │
│  │  0  │  1  │  2  │  3  │  4  │  5  │  6  │  7  │  8  │       │
│  │(A-B)│(C-B)│(C-B)│(C-B)│(C-B)│(C-B)│(C-B)│(C-B)│(C) │       │
│  └─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘       │
│    [ ]   [ ]   [ ]   [ ]   [✓]   [ ]   [ ]   [ ]   [ ]         │
│                                                                 │
│  ┌─────────────────────────────────────────────────────┐       │
│  │ Settings                                            │       │
│  │                                                     │       │
│  │  Include Sharps & Flats    [OFF]                   │       │
│  │  Enable Audio              [ON]                    │       │
│  │  Show Correct Answer       [OFF]                   │       │
│  └─────────────────────────────────────────────────────┘       │
│                                                                 │
│                    [ Start Lesson ]                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Components

**1. Piano Visualization (Top Section)**

- Display all 88 keys horizontally
- Keys rendered as simplified 2D rectangles (not 3D here, just overview)
- White keys: white/light fill with dark border
- Black keys: black/dark fill, narrower, positioned between appropriate white keys
- Group keys into octave boxes with visible borders
- Each octave box contains its keys and is labeled (Octave 0, Octave 1, etc.)
- Partial octaves (0 and 8) still get their own boxes

**2. Octave Checkboxes**

- One checkbox centered below each octave box
- Checkbox state: checked = octave included in lesson
- **Default state on app load**: Only Octave 4 is checked (middle C octave, best starting point for beginners)
- Multiple octaves can be checked simultaneously
- Minimum one octave must be checked to enable Start button

**3. Settings Panel**

Three toggle switches (use switch UI component, not checkboxes, for visual distinction):

| Setting | Default | Description |
|---------|---------|-------------|
| Include Sharps & Flats | OFF | When OFF: only natural notes (white keys). When ON: include all enharmonic spellings of black keys |
| Enable Audio | ON | When ON: play piano sound on answer. When OFF: silent |
| Show Correct Answer | OFF | When ON: highlight correct key after wrong answer. When OFF: just show red flash |

**4. Start Lesson Button**

- Prominent button below settings
- **Disabled state**: When zero octaves are checked
  - Visual: grayed out, reduced opacity, no hover effect, cursor: not-allowed
- **Enabled state**: When at least one octave is checked
  - Visual: primary color (suggest blue #3b82f6), hover effect, cursor: pointer
- Click action: Navigate to Lesson Screen, initialize lesson with current settings

#### Responsive Behavior

- Piano visualization should scale horizontally to fit viewport
- Minimum viewport width: 768px (tablet and up for MVP)
- Below minimum: show message suggesting larger screen

---

### Lesson Screen

#### Purpose
The core learning experience. Display a note, user identifies the key.

#### Visual Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    ┌─────────────────────┐                      │
│                    │     𝄞   ●          │   ← Staff with       │
│                    │   ════════════     │     clef (50% opacity)│
│                    │   ════════════     │     and note          │
│                    │   ════════════     │                       │
│                    │   ════════════     │                       │
│                    │   ════════════     │                       │
│                    └─────────────────────┘                      │
│                                                                 │
│            ┌─────────────────────────────────┐                  │
│           ╱│ │░│ │░│ │ │░│ │░│ │░│ │        │  ← 3D keyboard   │
│          ╱ │ │░│ │░│ │ │░│ │░│ │░│ │        │    at angle      │
│         ╱  │ │ │ │ │ │ │ │ │ │ │ │ │        │                  │
│        ╱   │ C │ D │ E │ F │ G │ A │ B │    │                  │
│            └─────────────────────────────────┘                  │
│                                                                 │
│                      [ Stop Lesson ]                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Components

**1. Staff Display (Top Area)**

Rendered using VexFlow library.

Specifications:
- **Staff lines**: 5 horizontal lines, rendered large and clear
- **Clef**: Treble or bass clef displayed at 50% opacity (de-emphasized but provides context)
  - Clef selection rule: Note in octave 4 or higher → treble clef. Note in octave 3 or lower → bass clef.
- **Note**: Single whole note rendered at 100% opacity, large and prominent
- **Accidentals**: When note has sharp or flat, render the symbol directly to the left of the note head (standard notation convention)
- **Leger lines**: Automatically rendered by VexFlow for notes above/below the staff

VexFlow integration notes:
- Create a Stave with appropriate clef
- Create a StaveNote with the pitch
- Add Accidental modifier if sharp/flat
- Render to SVG in a container div
- Apply CSS to set clef opacity to 50%

**2. 3D Piano Keyboard (Middle Area)**

Rendered using React Three Fiber (R3F).

Specifications:
- **Keys displayed**: Single octave only (7 white keys, 5 black keys)
- **Key labels**: Optional subtle labels on white keys (C, D, E, F, G, A, B) for orientation
- **3D perspective**: Camera positioned above and angled down at approximately 30-40 degrees from horizontal, simulating a player seated at piano looking at keys
- **White keys**: Proper notched profiles (see White Key Shapes section), light colored (white or off-white)
- **Black keys**: Raised above white keys by ~40% of their length, dark colored (black or near-black)
- **Hover state**: Subtle highlight on key under cursor (slight brightness increase)
- **Click detection**: R3F raycasting handles click events on 3D objects
- **Black keys always visible**: Regardless of sharps/flats toggle (user can make mistakes by clicking them)

Camera setup (R3F/Three.js):
```javascript
// Approximate values - tune during implementation
camera.position.set(0, 5, 8);  // Above and in front
camera.lookAt(0, 0, 0);        // Looking at keyboard center
camera.fov = 50;               // Field of view
```

**3. Stop Lesson Button**

- Positioned below the keyboard
- Click action: End lesson immediately, navigate to Analytics Screen
- Style: Secondary/outline style to distinguish from primary actions

#### Critical Interaction Model

**THE USER CLICKS PITCH CLASS, NOT SPECIFIC OCTAVE KEY.**

The displayed keyboard shows a generic single octave. The note on the staff indicates both pitch class AND octave (via staff position). However, the user's task is to identify the correct **pitch class** (which key to press).

Example:
- Staff shows C#5 (C# in octave 5, on treble clef)
- Keyboard shows one generic octave
- User clicks the C# (black key between C and D)
- This is CORRECT - user identified the pitch class correctly

The octave information on the staff is for learning to READ which octave a note is in, but the keyboard interaction only validates pitch class. This simplifies the UI (single octave display) while still teaching octave reading through the staff.

**Answer validation logic:**
```typescript
function isCorrectAnswer(displayedNote: NoteId, clickedKey: PitchClass): boolean {
  const displayedPitchClass = extractPitchClass(displayedNote); // "C#5" → "C#"
  return displayedPitchClass === clickedKey;
}
```

For enharmonic equivalents: If "Gb4" is displayed and user clicks the black key between F and G, it's correct (that key is both F# and Gb).

#### Feedback System

**On user click:**

1. Determine if answer is correct
2. Display feedback:

**Correct Answer:**
- Background flashes GREEN (#22c55e)
- If audio enabled: play the note sound
- Flash duration: 800ms
- Transition: fade out over 200ms

**Wrong Answer:**
- Background flashes RED (#ef4444)
- If audio enabled: play the clicked note sound (so user hears their mistake)
- Flash duration: 800ms
- Transition: fade out over 200ms
- If "Show Correct Answer" is ON:
  - After red flash, highlight the correct key with a BLUE (#3b82f6) glow/outline for 1000ms
  - Optionally play the correct note after a 300ms delay

3. After feedback completes, automatically advance to next note

**Feedback implementation:**
- Use CSS transition on a full-screen overlay div
- Overlay sits behind the content with pointer-events: none
- Animate background-color and opacity

---

### Analytics Screen

#### Purpose
Show session performance summary so user can identify weak areas.

#### Visual Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                     Session Complete!                           │
│                                                                 │
│                  Overall Accuracy: 78%                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Note    │  Times Shown  │  Correct  │  Accuracy       │   │
│  ├──────────┼───────────────┼───────────┼─────────────────┤   │
│  │  F#4     │      8        │     2     │  25%  ████░░░░  │   │
│  │  Bb3     │      6        │     2     │  33%  █████░░░  │   │
│  │  D5      │     12        │     6     │  50%  ███████░  │   │
│  │  G4      │     10        │     8     │  80%  █████████ │   │
│  │  C4      │     14        │    13     │  93%  ██████████│   │
│  └──────────┴───────────────┴───────────┴─────────────────┘   │
│                                                                 │
│                    [ Back to Main Menu ]                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Components

**1. Header**
- "Session Complete!" title
- Overall accuracy percentage in large font (48px+)
- Calculate: (total correct / total shown) * 100, rounded to nearest integer

**2. Statistics Table**

Columns:
| Column | Description |
|--------|-------------|
| Note | NoteId string (e.g., "F#4", "Bb3", "C5") |
| Times Shown | How many times this note was displayed |
| Correct | How many times user answered correctly |
| Accuracy | Percentage with visual bar indicator |

Table behavior:
- **Sort order**: Ascending by accuracy (worst performing notes at top)
- **Row coloring** based on accuracy:
  - 0-40%: Red background tint (#fee2e2)
  - 41-70%: Yellow background tint (#fef9c3)
  - 71-100%: Green background tint (#dcfce7)
- **Visual accuracy bar**: Small horizontal bar next to percentage showing filled proportion
- Only show notes that were actually shown during the session (don't list notes with 0 appearances)

**3. Back Button**
- "Back to Main Menu" button
- Click action: Navigate to Main Screen
- Resets all lesson state (fresh start)

---

## Learning Algorithm

### Note Set Generation

When lesson starts:

```typescript
function generateNoteSet(
  selectedOctaves: number[],
  includeSharpsFlats: boolean
): NoteId[] {
  const notes: NoteId[] = [];

  for (const octave of selectedOctaves) {
    // Add natural notes
    const naturals = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

    // Handle partial octaves
    if (octave === 0) {
      // Octave 0 only has A, Bb, B
      notes.push('A0', 'B0');
      if (includeSharpsFlats) {
        notes.push('Bb0');  // Only flat between A and B
      }
    } else if (octave === 8) {
      // Octave 8 only has C
      notes.push('C8');
    } else {
      // Full octave
      for (const natural of naturals) {
        notes.push(`${natural}${octave}`);
      }

      if (includeSharpsFlats) {
        // Add BOTH sharp and flat spellings for each black key
        notes.push(`C#${octave}`, `Db${octave}`);  // Same key
        notes.push(`D#${octave}`, `Eb${octave}`);  // Same key
        notes.push(`F#${octave}`, `Gb${octave}`);  // Same key
        notes.push(`G#${octave}`, `Ab${octave}`);  // Same key
        notes.push(`A#${octave}`, `Bb${octave}`);  // Same key
      }
    }
  }

  return notes;
}
```

**Note count examples:**
- 1 octave, no sharps/flats: 7 notes
- 1 octave, with sharps/flats: 7 + 10 = 17 notes (each black key = 2 spellings)
- 3 octaves, no sharps/flats: 21 notes
- 3 octaves, with sharps/flats: 51 notes

### Spaced Repetition with Anti-Clustering

#### State Structure

```typescript
interface LessonAlgorithmState {
  // Immutable for session
  fullNoteSet: NoteId[];           // All notes in this lesson

  // Mutable state
  remainingNotes: Set<NoteId>;     // Notes not yet shown this cycle
  errorWeights: Map<NoteId, number>; // note → error count (higher = show more)
  recentBuffer: NoteId[];          // Last N notes shown (FIFO, max length = BUFFER_SIZE)
  currentNote: NoteId | null;      // Currently displayed note

  // Statistics
  stats: Map<NoteId, { shown: number; correct: number }>;
}

const BUFFER_SIZE = 4;  // Minimum gap before note can repeat
```

#### Algorithm: Select Next Note

```typescript
function selectNextNote(state: LessonAlgorithmState): NoteId {
  // 1. Build candidate pool
  let candidates: NoteId[] = [];

  // Add remaining notes (not yet shown this cycle)
  candidates.push(...state.remainingNotes);

  // Add weighted wrong notes (already shown but missed)
  // Each error weight adds that note multiple times conceptually
  for (const [note, weight] of state.errorWeights) {
    for (let i = 0; i < weight; i++) {
      candidates.push(note);
    }
  }

  // 2. Filter out recently shown notes (anti-clustering)
  candidates = candidates.filter(note => !state.recentBuffer.includes(note));

  // 3. Handle edge case: all candidates filtered out
  if (candidates.length === 0) {
    // This can happen if note set is very small (< BUFFER_SIZE)
    // Fall back to any note not shown most recently
    candidates = state.fullNoteSet.filter(note => note !== state.recentBuffer[state.recentBuffer.length - 1]);
  }

  // 4. Random selection from candidates
  const index = Math.floor(Math.random() * candidates.length);
  return candidates[index];
}
```

#### Algorithm: Process Answer

```typescript
function processAnswer(
  state: LessonAlgorithmState,
  clickedPitchClass: string,
  isCorrect: boolean
): LessonAlgorithmState {
  const note = state.currentNote!;

  // Update statistics
  const noteStats = state.stats.get(note) || { shown: 0, correct: 0 };
  noteStats.shown++;
  if (isCorrect) {
    noteStats.correct++;
  } else {
    // Increment error weight for wrong answers
    const currentWeight = state.errorWeights.get(note) || 0;
    state.errorWeights.set(note, currentWeight + 1);
  }
  state.stats.set(note, noteStats);

  // Update remaining notes
  state.remainingNotes.delete(note);

  // Check for cycle completion
  if (state.remainingNotes.size === 0) {
    // Refill remaining notes for new cycle
    state.remainingNotes = new Set(state.fullNoteSet);
  }

  // Update recent buffer (maintain FIFO, max size)
  state.recentBuffer.push(note);
  if (state.recentBuffer.length > BUFFER_SIZE) {
    state.recentBuffer.shift();  // Remove oldest
  }

  return state;
}
```

#### Anti-Clustering Rules (Summary)

1. **Minimum gap**: A note cannot appear again until at least 4 other notes have been shown
2. **Buffer persists across cycles**: When remainingNotes is refilled, recentBuffer is NOT cleared
3. **Weighted probability**: Wrong notes appear more frequently but still respect the minimum gap
4. **No back-to-back**: Guaranteed by buffer - same note will never appear twice in a row

#### Edge Cases

- **Very small note set** (< 4 notes): Buffer size effectively reduces; some repetition unavoidable
- **All notes in buffer wrong**: Algorithm will cycle through buffer as it ages out
- **User never gets a note wrong**: No error weighting, just random cycling through set

---

## Technical Architecture

### Technology Stack

| Component | Technology | Version | Rationale |
|-----------|------------|---------|-----------|
| Runtime | Node.js | 22.x LTS | Required for build tooling, testing, dev server |
| Framework | React | 18.x | Coupled with R3F for 3D; stable ecosystem with Zustand, RTL, Radix |
| Language | TypeScript | 5.x | Type safety, better IDE support, catch errors early |
| Build Tool | Vite | 5.x | Fast ESM dev server, optimized production builds |
| 3D Rendering | React Three Fiber | 8.x | Declarative Three.js for React, proper 3D geometry |
| Three.js | three | 0.160.x | Underlying 3D library (peer dep of R3F) |
| Music Notation | VexFlow | 4.x | Industry standard notation rendering, handles edge cases |
| Audio | smplr | 0.15.x | Lightweight sampler, Splendid Grand Piano, simple API |
| State Management | Zustand | 4.x | Minimal boilerplate, no providers, handles complex state |
| Styling | Tailwind CSS | 3.x | Utility-first, rapid development |
| UI Primitives | Radix UI | latest | Accessible, unstyled components for toggles, buttons |
| Testing | Vitest | 1.x | Fast, Vite-native, Jest-compatible API |
| Testing (React) | @testing-library/react | 14.x | Component testing best practices |
| Testing (E2E) | Playwright | 1.x | End-to-end browser testing for full lesson flow |

### Architecture Decision: React + R3F

**Key insight: React and R3F are a package deal.** React Three Fiber (R3F) is React-specific. Choosing R3F for 3D means choosing React as the framework. This coupling is intentional and beneficial for this project:

- R3F's declarative model simplifies state-driven 3D (key highlighting on click)
- Zustand, RTL, and Radix UI all assume React
- Mature ecosystem with documented integration patterns
- "Boring, stable" combo reduces surprise factor

**Alternative considered: Vanilla Three.js**

Using plain Three.js instead of R3F would decouple the 3D from the framework choice, allowing any UI framework (Svelte, Vue, etc.). For this project's simple 3D needs (12 static keys, click handlers, color changes), the vanilla glue code would be bounded and predictable.

This path was not chosen because:
- R3F's declarative state→render binding reduces complexity for this use case
- Bundle size is not a constraint (local network deployment)
- Single-developer project benefits from ecosystem stability

If framework flexibility becomes important later, extracting the 3D to vanilla Three.js is a viable refactor.

### Project Structure

```
notes/
├── docs/
│   └── Requirements and Technical Specification.md
├── src/
│   ├── components/
│   │   ├── MainScreen/
│   │   │   ├── MainScreen.tsx           # Screen container
│   │   │   ├── PianoOverview.tsx        # 88-key 2D visualization
│   │   │   ├── OctaveBox.tsx            # Single octave group with checkbox
│   │   │   └── SettingsPanel.tsx        # Toggle switches
│   │   │
│   │   ├── LessonScreen/
│   │   │   ├── LessonScreen.tsx         # Screen container
│   │   │   ├── StaffDisplay.tsx         # VexFlow wrapper
│   │   │   ├── PianoKeyboard3D.tsx      # R3F Canvas and scene
│   │   │   ├── WhiteKey.tsx             # 3D white key mesh
│   │   │   ├── BlackKey.tsx             # 3D black key mesh
│   │   │   └── FeedbackOverlay.tsx      # Green/red flash
│   │   │
│   │   ├── AnalyticsScreen/
│   │   │   ├── AnalyticsScreen.tsx      # Screen container
│   │   │   ├── AccuracyHeader.tsx       # Overall percentage
│   │   │   └── StatsTable.tsx           # Per-note breakdown
│   │   │
│   │   └── ui/
│   │       ├── Button.tsx               # Reusable button component
│   │       └── Toggle.tsx               # Reusable toggle switch
│   │
│   ├── stores/
│   │   ├── settingsStore.ts             # Octave selection, toggles
│   │   └── lessonStore.ts               # Lesson algorithm state
│   │
│   ├── utils/
│   │   ├── noteUtils.ts                 # Note generation, parsing, validation
│   │   ├── staffPositions.ts            # Note → staff position mapping
│   │   ├── keyGeometry.ts               # 3D key shape definitions
│   │   └── audioPlayer.ts               # smplr wrapper, lazy loading
│   │
│   ├── hooks/
│   │   ├── useLessonEngine.ts           # Orchestrates lesson flow
│   │   ├── useAudio.ts                  # Audio playback hook
│   │   └── useVexFlow.ts                # VexFlow rendering hook
│   │
│   ├── types/
│   │   └── index.ts                     # TypeScript interfaces
│   │
│   ├── App.tsx                          # Root component, screen routing
│   ├── main.tsx                         # Entry point
│   └── index.css                        # Global styles, Tailwind imports
│
├── public/
│   └── (static assets if needed)
│
├── e2e/                         # Playwright E2E tests
│   └── lesson-flow.spec.ts
├── index.html
├── package.json                  # Must include "engines": { "node": ">=22.0.0" }
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── playwright.config.ts
```

### Data Types

```typescript
// types/index.ts

// Note letter names
export type NoteLetter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

// Accidental types
export type Accidental = 'sharp' | 'flat' | 'natural';

// Unique note identifier: "C#4", "Bb3", "G5"
export type NoteId = string;

// Pitch class without octave: "C#", "Bb", "G"
export type PitchClass = string;

// Structured note representation
export interface Note {
  letter: NoteLetter;
  accidental: Accidental;
  octave: number;
}

// Clef types
export type Clef = 'treble' | 'bass';

// Lesson statistics per note
export interface NoteStats {
  shown: number;
  correct: number;
}

// Settings state
export interface SettingsState {
  selectedOctaves: Set<number>;
  includeSharpsFlats: boolean;
  audioEnabled: boolean;
  showCorrectAnswer: boolean;
}

// Lesson algorithm state
export interface LessonState {
  isActive: boolean;
  fullNoteSet: NoteId[];
  remainingNotes: Set<NoteId>;
  errorWeights: Map<NoteId, number>;
  recentBuffer: NoteId[];
  currentNote: NoteId | null;
  stats: Map<NoteId, NoteStats>;
  feedbackState: 'none' | 'correct' | 'incorrect' | 'showAnswer';
}

// Screen routing
export type Screen = 'main' | 'lesson' | 'analytics';

// White key profile types
export type WhiteKeyProfile = 'type1' | 'type2' | 'type3';
```

### Utility Functions

```typescript
// utils/noteUtils.ts

/**
 * Parse NoteId string into structured Note object
 * "C#4" → { letter: 'C', accidental: 'sharp', octave: 4 }
 */
export function parseNote(noteId: NoteId): Note;

/**
 * Convert Note object to NoteId string
 * { letter: 'C', accidental: 'sharp', octave: 4 } → "C#4"
 */
export function formatNote(note: Note): NoteId;

/**
 * Extract pitch class from NoteId (remove octave)
 * "C#4" → "C#"
 * "Bb3" → "Bb"
 */
export function extractPitchClass(noteId: NoteId): PitchClass;

/**
 * Check if two pitch classes are enharmonic equivalents
 * ("C#", "Db") → true
 * ("C#", "C") → false
 */
export function areEnharmonic(a: PitchClass, b: PitchClass): boolean;

/**
 * Get the physical key position (0-11) for a pitch class
 * "C" → 0, "C#"/"Db" → 1, "D" → 2, etc.
 */
export function getKeyPosition(pitchClass: PitchClass): number;

/**
 * Determine if a pitch class is a black key
 */
export function isBlackKey(pitchClass: PitchClass): boolean;

/**
 * Get the appropriate clef for a note
 * Octave >= 4 → treble, else bass
 */
export function getClefForNote(noteId: NoteId): Clef;

/**
 * Generate all notes for given octaves and settings
 */
export function generateNoteSet(
  selectedOctaves: number[],
  includeSharpsFlats: boolean
): NoteId[];

/**
 * Get the white key profile type for a given letter
 * C, F → 'type1'
 * D, G, A → 'type2'
 * E, B → 'type3'
 */
export function getWhiteKeyProfile(letter: NoteLetter): WhiteKeyProfile;
```

### Store Definitions

```typescript
// stores/settingsStore.ts
import { create } from 'zustand';

interface SettingsStore {
  selectedOctaves: Set<number>;
  includeSharpsFlats: boolean;
  audioEnabled: boolean;
  showCorrectAnswer: boolean;

  // Actions
  toggleOctave: (octave: number) => void;
  setIncludeSharpsFlats: (value: boolean) => void;
  setAudioEnabled: (value: boolean) => void;
  setShowCorrectAnswer: (value: boolean) => void;
  isStartEnabled: () => boolean;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  selectedOctaves: new Set([4]),  // Default: octave 4 only
  includeSharpsFlats: false,       // Default: off
  audioEnabled: true,              // Default: on
  showCorrectAnswer: false,        // Default: off

  toggleOctave: (octave) => set((state) => {
    const newSet = new Set(state.selectedOctaves);
    if (newSet.has(octave)) {
      newSet.delete(octave);
    } else {
      newSet.add(octave);
    }
    return { selectedOctaves: newSet };
  }),

  setIncludeSharpsFlats: (value) => set({ includeSharpsFlats: value }),
  setAudioEnabled: (value) => set({ audioEnabled: value }),
  setShowCorrectAnswer: (value) => set({ showCorrectAnswer: value }),

  isStartEnabled: () => get().selectedOctaves.size > 0,
}));
```

```typescript
// stores/lessonStore.ts
import { create } from 'zustand';

interface LessonStore {
  // State
  isActive: boolean;
  fullNoteSet: NoteId[];
  remainingNotes: Set<NoteId>;
  errorWeights: Map<NoteId, number>;
  recentBuffer: NoteId[];
  currentNote: NoteId | null;
  stats: Map<NoteId, NoteStats>;
  feedbackState: 'none' | 'correct' | 'incorrect' | 'showAnswer';

  // Actions
  startLesson: (noteSet: NoteId[]) => void;
  selectNextNote: () => void;
  processAnswer: (clickedPitchClass: PitchClass) => boolean;
  setFeedbackState: (state: FeedbackState) => void;
  endLesson: () => void;
  getSessionStats: () => { overall: number; perNote: Array<NoteId, NoteStats> };
}
```

### 3D Key Geometry

```typescript
// utils/keyGeometry.ts
import * as THREE from 'three';

// Key dimensions (relative units, scale as needed)
const WHITE_KEY_WIDTH = 1;
const WHITE_KEY_LENGTH = 5;
const WHITE_KEY_HEIGHT = 0.5;
const BLACK_KEY_WIDTH = 0.6;
const BLACK_KEY_LENGTH = 3;
const BLACK_KEY_HEIGHT = 0.5;
const NOTCH_DEPTH = BLACK_KEY_LENGTH;
const NOTCH_WIDTH = BLACK_KEY_WIDTH / 2 + 0.05;  // Half black key + gap

/**
 * Create white key geometry with appropriate notch profile
 */
export function createWhiteKeyGeometry(profile: WhiteKeyProfile): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();

  // Base rectangle with notches based on profile
  // Type 1 (C, F): notch on right
  // Type 2 (D, G, A): notches on both sides
  // Type 3 (E, B): notch on left

  // Implementation: define 2D shape path, then extrude
  // ... (detailed path construction)

  const extrudeSettings = {
    depth: WHITE_KEY_HEIGHT,
    bevelEnabled: false,
  };

  return new THREE.ExtrudeGeometry(shape, extrudeSettings);
}

/**
 * Create black key geometry (simple box)
 */
export function createBlackKeyGeometry(): THREE.BoxGeometry {
  return new THREE.BoxGeometry(BLACK_KEY_WIDTH, BLACK_KEY_HEIGHT, BLACK_KEY_LENGTH);
}
```

### Audio Integration

```typescript
// utils/audioPlayer.ts
import { Splendid } from 'smplr';

let piano: Splendid | null = null;
let isLoading = false;
let isLoaded = false;

/**
 * Initialize audio (call when audio is enabled)
 */
export async function initAudio(): Promise<void> {
  if (piano || isLoading) return;

  isLoading = true;
  const context = new AudioContext();
  piano = new Splendid(context);
  await piano.load();
  isLoaded = true;
  isLoading = false;
}

/**
 * Play a note
 * @param noteId - e.g., "C#4"
 */
export function playNote(noteId: NoteId): void {
  if (!piano || !isLoaded) return;

  // Convert NoteId to MIDI note number or smplr format
  // smplr typically uses note names like "C4", "Db4"
  const smplrNote = convertToSmplrFormat(noteId);
  piano.start(smplrNote);
}

/**
 * Check if audio is ready
 */
export function isAudioReady(): boolean {
  return isLoaded;
}
```

### VexFlow Integration

```typescript
// hooks/useVexFlow.ts
import { useEffect, useRef } from 'react';
import Vex from 'vexflow';

interface UseVexFlowOptions {
  noteId: NoteId;
  clef: Clef;
  containerRef: React.RefObject<HTMLDivElement>;
}

export function useVexFlow({ noteId, clef, containerRef }: UseVexFlowOptions) {
  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous render
    containerRef.current.innerHTML = '';

    const { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } = Vex.Flow;

    const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
    renderer.resize(400, 150);
    const context = renderer.getContext();

    // Create stave with clef
    const stave = new Stave(10, 20, 380);
    stave.addClef(clef);
    stave.setContext(context).draw();

    // Apply 50% opacity to clef via CSS after render
    const clefElement = containerRef.current.querySelector('.vf-clef');
    if (clefElement) {
      (clefElement as SVGElement).style.opacity = '0.5';
    }

    // Parse note and create StaveNote
    const note = parseNote(noteId);
    const vexKey = `${note.letter.toLowerCase()}/${note.octave}`;
    const staveNote = new StaveNote({
      keys: [vexKey],
      duration: 'w',  // whole note
      clef: clef,
    });

    // Add accidental if needed
    if (note.accidental === 'sharp') {
      staveNote.addModifier(new Accidental('#'));
    } else if (note.accidental === 'flat') {
      staveNote.addModifier(new Accidental('b'));
    }

    // Create voice and format
    const voice = new Voice({ num_beats: 4, beat_value: 4 });
    voice.addTickable(staveNote);
    new Formatter().joinVoices([voice]).format([voice], 350);
    voice.draw(context, stave);

  }, [noteId, clef, containerRef]);
}
```

---

## Error Handling

### Initialization Errors

| Error | Handling |
|-------|----------|
| WebGL not supported | Show message: "Your browser doesn't support 3D graphics. Please use a modern browser like Chrome, Firefox, or Edge." Disable lesson start. |
| VexFlow fails to load | Show message: "Music notation failed to load. Please refresh the page." |
| Audio context blocked | Show message: "Audio was blocked. Click anywhere to enable sound." (Browser autoplay policies) |
| Audio samples fail to load | Silently disable audio, show small notice: "Audio unavailable" |

### Runtime Errors

| Error | Handling |
|-------|----------|
| R3F render error | Catch with error boundary, show fallback message |
| Note generation returns empty | Should not happen with valid input; defensive check, show error |
| Algorithm state corruption | Reset to initial state, log error for debugging |

### Implementation Notes

- Wrap R3F Canvas in React Error Boundary
- Use try-catch around audio initialization
- Validate settings before starting lesson
- Log errors to console in development

---

## Browser Support

**Target Browsers:**
- Chrome 90+
- Firefox 90+
- Safari 15+
- Edge 90+

**Requirements:**
- WebGL 2.0 support (for Three.js)
- Web Audio API support (for smplr)
- ES2020+ JavaScript support

**Not Supported:**
- Internet Explorer (any version)
- Mobile browsers (MVP is desktop-focused)

---

## Performance Considerations

Bundle size is not a constraint (app runs on local network).

- **3D Rendering**: Single octave (12 keys) is trivial for any modern GPU
- **VexFlow**: Renders once per note change, SVG output is lightweight at runtime
- **State Updates**: Zustand is optimized, minimal re-renders
- **Audio**: Samples lazy-loaded when audio is enabled

### Optional: Lazy-Loading for Faster Initial Paint

Not required, but if faster initial load is desired:

```typescript
const StaffDisplay = lazy(() => import('./StaffDisplay'));
const PianoKeyboard3D = lazy(() => import('./PianoKeyboard3D'));
```

---

## Accessibility Notes (Future Enhancement)

MVP does not include full accessibility support. Future considerations:

- Keyboard navigation for piano keys (1-7 for white, q-t for black?)
- ARIA labels for screen readers
- High contrast mode
- Focus indicators

---

## Testing Strategy

### Unit Tests (Vitest)

- `noteUtils.ts`: All parsing, formatting, validation functions
- `lessonStore.ts`: Algorithm state transitions, edge cases
- `settingsStore.ts`: Toggle behavior, validation

### Component Tests (React Testing Library)

- Main screen: Octave selection, toggle interactions, start button state
- Analytics screen: Table rendering, sorting, accuracy calculation

### E2E Tests (Playwright)

- Full lesson flow: Start → Answer questions → Stop → View analytics
- Verify 3D keyboard renders and responds to clicks
- Verify staff notation displays correctly
- Audio playback (mocked or with Web Audio API stubbing)

### Manual Testing Checklist

- [ ] All 9 octave checkboxes work
- [ ] Start button enables/disables correctly
- [ ] 3D keyboard renders and keys are clickable
- [ ] Correct/incorrect feedback displays
- [ ] Notes cycle through properly
- [ ] Wrong notes appear more frequently
- [ ] Anti-clustering works (no immediate repeats)
- [ ] Analytics shows correct data
- [ ] Audio plays when enabled
- [ ] Audio silent when disabled

---

## Acceptance Criteria

### Main Screen
- [ ] 88-key piano visualization with octave groupings displayed
- [ ] 9 checkboxes (one per octave), octave 4 checked by default
- [ ] Three toggle switches with correct defaults (sharps/flats: off, audio: on, show answer: off)
- [ ] Start button disabled when no octaves selected
- [ ] Start button enabled when at least one octave selected
- [ ] Clicking start navigates to lesson screen

### Lesson Screen
- [ ] Staff renders with clef at 50% opacity
- [ ] Note renders correctly positioned on staff
- [ ] Accidentals display when applicable
- [ ] Leger lines display for notes outside staff
- [ ] 3D keyboard shows single octave at player viewing angle
- [ ] Clicking key triggers answer validation
- [ ] Correct answer: green flash, advance to next note
- [ ] Wrong answer: red flash, optionally show correct key
- [ ] Audio plays note on answer (when enabled)
- [ ] Stop button navigates to analytics

### Analytics Screen
- [ ] Overall accuracy percentage displayed prominently
- [ ] Table shows all practiced notes
- [ ] Table sorted by accuracy ascending (worst first)
- [ ] Row colors indicate performance (red/yellow/green)
- [ ] Back button returns to main screen

### Learning Algorithm
- [ ] All selected notes generated correctly (including enharmonics when enabled)
- [ ] Notes cycle through without repetition until set complete
- [ ] Wrong notes weighted to appear more frequently
- [ ] Same note never appears within 4-note window
- [ ] Buffer persists across set cycles (no boundary repetition)
- [ ] Statistics accurately track shown/correct counts

---

## Implementation Order (Suggested)

1. **Project Setup**: Vite, React, TypeScript, Tailwind, folder structure
2. **Types & Utils**: Note types, parsing, generation functions
3. **Stores**: Settings store, lesson store (without algorithm)
4. **Main Screen**: Static layout, octave visualization, toggles, navigation
5. **Lesson Algorithm**: Core selection/answer logic with tests
6. **Lesson Screen (2D first)**: Staff display with VexFlow, basic keyboard (2D placeholder)
7. **3D Keyboard**: R3F integration, key geometry, click handling
8. **Feedback System**: Flash overlay, correct answer highlight
9. **Audio**: smplr integration, lazy loading
10. **Analytics Screen**: Table rendering, stats calculation
11. **Polish**: Transitions, responsive adjustments, error handling
12. **Testing**: Unit tests, integration tests, manual QA
