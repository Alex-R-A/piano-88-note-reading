# Piano Note Learning Application

## Project Overview

A browser-based React application that teaches users to read musical staff notation and map notes to their corresponding positions on a piano keyboard. The application presents notes on a musical staff and requires users to identify the correct key on a visual 3D piano keyboard.

---

## User Requirements

### Screen Flow

```
Main Screen (Octave Selection) → Lesson Screen (Quiz) → Analytics Screen (Results)
```

### Main Screen

**Visual Elements:**

1. **88-Key Piano Visualization**
   - Full piano keyboard displayed horizontally
   - White keys and black keys rendered
   - Octaves visually grouped with surrounding boxes
   - Each octave group has a checkbox below it for selection

2. **Octave Selection**
   - Checkboxes below each octave box
   - First octave checked by default on app launch
   - Multiple octaves can be selected simultaneously
   - User builds custom practice set by selecting desired octaves

3. **Toggle Options**
   - **Sharps/Flats Toggle**: On/Off, controls whether accidentals are included in lesson
   - **Audio Toggle**: On/Off, controls whether piano sounds play during lesson
   - **Show Correct Answer Toggle**: On/Off (default Off), controls whether correct key is revealed after wrong answer

4. **Start Button**
   - Initiates lesson with selected configuration
   - Disabled state when zero octaves are selected
   - Enabled when at least one octave is checked

### Lesson Screen

**Visual Layout:**

```
┌─────────────────────────────────────┐
│                                     │
│         STAFF WITH NOTE             │
│         (large, top area)           │
│                                     │
├─────────────────────────────────────┤
│                                     │
│         3D PIANO KEYBOARD           │
│         (single octave, large)      │
│         (angled player perspective) │
│                                     │
├─────────────────────────────────────┤
│         [Stop Lesson Button]        │
└─────────────────────────────────────┘
```

**Staff Display (Top Area):**

- Five staff lines rendered large
- Clef displayed at 50% opacity (treble or bass depending on note range)
- Single note displayed prominently
- Accidentals (# or ♭) shown directly next to note head when applicable (no key signatures)
- Leger lines rendered for notes outside the five main lines

**3D Piano Keyboard (Bottom Area):**

- Single octave displayed (7 white keys, 5 black keys)
- Rendered in 3D at player viewing angle (looking down at keys as if seated at piano)
- White keys with proper notched profiles where black keys sit
- Black keys raised above white keys
- All keys clickable
- Black keys always visible regardless of sharps/flats toggle setting

**Interaction Flow:**

1. Note appears on staff
2. User clicks key on 3D keyboard
3. Background flashes feedback color:
   - Green: Correct answer
   - Red: Wrong answer
4. Flash duration: approximately 1 second
5. If wrong and "Show Correct Answer" is enabled, correct key is highlighted
6. Next note appears automatically after feedback

**Stop Lesson Button:**
- Visible during lesson
- Clicking exits lesson and navigates to Analytics Screen

### Analytics Screen

**Visual Layout:**

```
┌─────────────────────────────────────┐
│         Overall Accuracy: 88%       │
├─────────────────────────────────────┤
│  Note  │  Shown  │  Correct  │  %   │
├────────┼─────────┼───────────┼──────┤
│  F#4   │    8    │     3     │ 37%  │
│  Bb3   │    6    │     3     │ 50%  │
│  G4    │   12    │     9     │ 75%  │
│  ...   │   ...   │    ...    │ ...  │
└─────────────────────────────────────┘
```

**Content:**

- Overall accuracy percentage displayed prominently at top
- Table with one row per note
- Columns: Note name, times shown, times correct, accuracy percentage
- Sorted by accuracy ascending (most missed notes at top)
- Navigation back to main screen

---

## Learning Algorithm

### Note Set Generation

When lesson starts:

1. Collect all notes within selected octaves
2. If sharps/flats toggle is OFF: include only natural notes (A, B, C, D, E, F, G per octave)
3. If sharps/flats toggle is ON: include all enharmonic spellings as separate items
   - F# and Gb are two distinct items in the set
   - User must learn both spellings map to same physical key
   - Black keys may appear multiple times with different notations

### Spaced Repetition with Anti-Clustering

**Core Algorithm:**

```
State:
  - remainingSet: notes not yet shown in current cycle
  - wrongNotes: map of note → weight (higher = show more often)
  - recentBuffer: last N notes shown (N = 4)
  - sessionStats: map of note → {shown: number, correct: number}

On each turn:
  1. Build candidate pool:
     - All notes in remainingSet
     - Weighted entries from wrongNotes (notes with higher weights appear multiple times conceptually)

  2. Filter candidates:
     - Remove any note that appears in recentBuffer

  3. Select next note:
     - Random selection from filtered candidates
     - Weight influences probability for wrong notes

  4. Update state:
     - Remove selected note from remainingSet (if present)
     - Add selected note to recentBuffer (maintain size N, drop oldest)
     - If remainingSet is empty, refill from full note set (start new cycle)

  5. On user answer:
     - Update sessionStats
     - If wrong: increment weight in wrongNotes
```

**Anti-Clustering Rules:**

1. **Minimum Gap**: At least 4 notes must be shown between any repetition of the same note
2. **Cross-Cycle Persistence**: The recentBuffer persists when remainingSet is refilled
   - Prevents: last note of cycle N being same as first note of cycle N+1
3. **Collision Prevention**: When a wrong note is reinserted, it cannot collide with the same note appearing naturally in the remaining set within the buffer window

**No Session Persistence:**

- All state resets when app is closed/refreshed
- No localStorage or database persistence
- Each session starts fresh

---

## Technical Architecture

### Technology Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Framework | React 18+ | Component-based UI, large ecosystem, explicit user requirement |
| Build Tool | Vite | Fast ESM-based dev server, superior to CRA, excellent React plugin |
| 3D Rendering | React Three Fiber | Declarative Three.js for React, proper 3D geometry for key shapes, camera positioning, built-in click raycasting |
| Music Notation | VexFlow | Industry standard for music engraving, handles clefs, accidentals, leger lines correctly, proper typography |
| Audio | smplr | Lighter than Tone.js, modern API, Splendid Grand Piano samples, sufficient for note playback |
| State Management | Zustand | Minimal boilerplate, 1KB bundle, handles both simple toggles and complex lesson algorithm state |
| Styling | Tailwind CSS + Custom CSS | Rapid development for UI, custom CSS for 3D-specific styling |
| Testing | Vitest + React Testing Library | Pairs with Vite, fast, good React component testing |

### Technology Rationale Deep Dive

**React Three Fiber over CSS 3D Transforms:**

Piano keys have complex notched profiles - white keys are not simple rectangles. A D key has notches on both sides where adjacent black keys sit. From the player viewing angle, these notch shapes are visible on the top face of keys.

CSS 3D transforms could approximate this with SVG paths and transformed divs, but it becomes a hack requiring multiple elements per key. R3F provides actual 3D scene with:
- Proper extruded geometry for key shapes
- Real camera positioning (player perspective)
- Built-in raycasting for click detection on 3D objects
- Potential for lighting/shadows to enhance depth perception

**VexFlow over Custom SVG:**

Music notation has established conventions for:
- Note head shapes and proportions
- Accidental positioning relative to note heads
- Clef symbols (treble, bass)
- Leger line spacing and length
- Staff line thickness and spacing

VexFlow implements these correctly. Custom SVG would require manually positioning elements and sourcing/creating proper musical symbols. The ~200KB bundle cost is justified by correctness guarantees and development time savings.

**smplr over Tone.js:**

Tone.js is a full Web Audio framework with synthesizers, effects chains, transport scheduling - features unused for simple "play note on click" functionality. smplr (by the same author as tonal and soundfont-player) is purpose-built for sample playback with a simpler API and smaller footprint.

Fallback: If smplr proves problematic, Tone.js Sampler with lazy-loaded samples is a reliable alternative.

**Zustand over Redux/Context:**

The lesson algorithm requires moderately complex state (remaining notes, wrong note weights, recent buffer). Zustand handles this with:
- No Provider wrapper boilerplate
- Direct store access in any component
- Support for computed/derived state
- Immer integration for immutable updates if needed

Redux Toolkit would work but adds unnecessary ceremony. React Context + useReducer would require prop drilling or multiple contexts.

### Component Architecture

```
src/
├── components/
│   ├── MainScreen/
│   │   ├── PianoOverview.tsx      # 88-key visualization with octave boxes
│   │   ├── OctaveCheckbox.tsx     # Individual octave selection
│   │   └── SettingsToggles.tsx    # Sharps/flats, audio, show answer toggles
│   │
│   ├── LessonScreen/
│   │   ├── StaffDisplay.tsx       # VexFlow integration, note rendering
│   │   ├── PianoKeyboard3D.tsx    # R3F scene with single octave
│   │   ├── PianoKey.tsx           # Individual 3D key component
│   │   └── FeedbackOverlay.tsx    # Green/red flash overlay
│   │
│   └── AnalyticsScreen/
│       ├── AccuracyHeader.tsx     # Overall percentage display
│       └── NoteStatsTable.tsx     # Per-note breakdown table
│
├── stores/
│   ├── settingsStore.ts           # Octave selection, toggles
│   └── lessonStore.ts             # Lesson algorithm state, actions
│
├── utils/
│   ├── noteUtils.ts               # Note generation, naming, staff positioning
│   ├── keyGeometry.ts             # 3D key shape definitions
│   └── audioPlayer.ts             # smplr wrapper
│
├── hooks/
│   ├── useLessonEngine.ts         # Lesson algorithm orchestration
│   └── useAudio.ts                # Audio playback hook
│
├── types/
│   └── index.ts                   # TypeScript interfaces
│
└── App.tsx                        # Router/screen management
```

### Data Structures

**Note Representation:**

```typescript
interface Note {
  letter: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
  accidental: 'sharp' | 'flat' | 'natural';
  octave: number; // 0-8 for 88-key piano (A0 to C8)
}

// Unique identifier string: "C#4", "Bb3", "G5"
type NoteId = string;
```

**Lesson State:**

```typescript
interface LessonState {
  // Configuration (from settings)
  noteSet: NoteId[];              // Full set of notes for this lesson

  // Algorithm state
  remainingNotes: Set<NoteId>;    // Notes not yet shown this cycle
  wrongNoteWeights: Map<NoteId, number>; // Error frequency weights
  recentBuffer: NoteId[];         // Last 4 notes shown (anti-repeat)

  // Current question
  currentNote: NoteId | null;

  // Session statistics
  stats: Map<NoteId, { shown: number; correct: number }>;
}
```

**Settings State:**

```typescript
interface SettingsState {
  selectedOctaves: Set<number>;   // Which octaves are checked
  includeSharpsFlats: boolean;    // Accidentals toggle
  audioEnabled: boolean;          // Audio toggle
  showCorrectAnswer: boolean;     // Reveal correct key on wrong answer
}
```

### 3D Key Geometry

Piano keys have three distinct white key profiles based on adjacent black keys:

```
Type 1 (C, F): Notch on right side only
Type 2 (D, G, A): Notches on both sides
Type 3 (E, B): Notch on left side only
Black keys: Uniform raised rectangle
```

Each white key is an extruded polygon:

```typescript
// Simplified - actual values need measurement
const KEY_PROFILES = {
  type1: [/* polygon points for C/F shape */],
  type2: [/* polygon points for D/G/A shape */],
  type3: [/* polygon points for E/B shape */],
  black: [/* simple rectangle */]
};
```

Camera positioned above and angled down (~30-45 degrees from horizontal) to simulate player seated at piano.

### Staff Position Mapping

Each note maps to a vertical position on the staff based on clef:

```typescript
// Treble clef: Middle C (C4) is one leger line below staff
// Bass clef: Middle C (C4) is one leger line above staff

const TREBLE_POSITIONS: Record<string, number> = {
  'E4': 0,   // First line (bottom)
  'F4': 0.5, // First space
  'G4': 1,   // Second line
  // ... etc
};

const BASS_POSITIONS: Record<string, number> = {
  'G2': 0,   // First line (bottom)
  'A2': 0.5, // First space
  // ... etc
};

// Determine clef based on note range
function getClefForNote(note: NoteId): 'treble' | 'bass' {
  const octave = extractOctave(note);
  return octave >= 4 ? 'treble' : 'bass';
}
```

---

## User Interface Specifications

### Main Screen

**Piano Overview Dimensions:**
- Full width of viewport (responsive)
- Height proportional to maintain key aspect ratios
- Octave boxes have visible borders with padding
- Checkboxes aligned center below each octave box

**Toggle Controls:**
- Grouped in a settings panel
- Clear labels: "Include Sharps & Flats", "Enable Audio", "Show Correct Answer"
- Switch/toggle UI component (not checkboxes for visual distinction from octave selection)

**Start Button:**
- Prominent placement below settings
- Clear disabled visual state (grayed out, no hover effects)
- Enabled state with primary color

### Lesson Screen

**Staff Display:**
- Large, centered
- Minimum height to clearly show leger lines above/below
- Clef at 50% opacity, note at 100% opacity
- Accidentals positioned per musical convention (to the left of note head)

**3D Keyboard:**
- Single octave, large keys for easy clicking
- Responsive: fills available width while maintaining proportions
- Clear visual distinction between white and black keys
- Hover state on keys (subtle highlight)

**Feedback Flash:**
- Full background color change (not just key)
- Green: #22c55e or similar (success)
- Red: #ef4444 or similar (error)
- Duration: 800-1000ms
- Smooth fade transition

### Analytics Screen

**Accuracy Display:**
- Large font size for overall percentage
- Positioned prominently at top

**Stats Table:**
- Sortable by clicking column headers (optional enhancement)
- Clear row separation
- Percentage column with color coding (red for low, yellow for medium, green for high)

---

## Audio Specifications

**Sample Loading:**
- Lazy load: samples loaded only when audio is enabled
- Load samples for selected octaves only (optimization)
- Loading indicator if samples not ready when user clicks

**Playback:**
- Trigger on correct answer (play the note that was shown)
- Trigger on wrong answer (play the note the user clicked, optionally followed by correct note)
- Short duration (~500ms) to not delay next question

**Controls:**
- Global mute via toggle on main screen
- No volume control in MVP (future enhancement)

---

## Future Considerations

Items explicitly out of scope for MVP but noted for potential future development:

1. **Key Signatures**: Practice reading notes with key signatures applied (all F's are F# in G major, etc.)
2. **Timing/Speed Mode**: Track response time, add time pressure challenges
3. **Session Persistence**: Save progress across browser sessions
4. **Multiple Notes**: Show chords or intervals instead of single notes
5. **Grand Staff**: Show both treble and bass clef simultaneously
6. **Mobile Optimization**: Touch-friendly 3D interaction, responsive layout for small screens
7. **Achievements/Gamification**: Streak tracking, milestones, progress badges
8. **Custom Practice Sets**: Save favorite octave/toggle configurations
9. **Note Naming Mode**: Reverse exercise - show key, user types note name
10. **MIDI Input**: Connect physical MIDI keyboard for input instead of clicking

---

## Acceptance Criteria Summary

### Main Screen
- [ ] 88 piano keys displayed with octave groupings
- [ ] Checkboxes for each octave, first octave checked by default
- [ ] Three toggle switches (sharps/flats, audio, show answer)
- [ ] Start button disabled when no octaves selected
- [ ] Start button navigates to lesson screen

### Lesson Screen
- [ ] Staff displays with correct clef at 50% opacity
- [ ] Note displays with accidentals when applicable
- [ ] 3D keyboard renders single octave at player angle
- [ ] Clicking key provides immediate color feedback
- [ ] Wrong notes tracked and shown more frequently
- [ ] Same note never appears within 4-note window
- [ ] Stop button navigates to analytics

### Analytics Screen
- [ ] Overall accuracy percentage displayed
- [ ] Per-note statistics in table format
- [ ] Table sorted by accuracy (worst first)
- [ ] Navigation back to main screen

### Algorithm
- [ ] All notes in set shown before cycling
- [ ] Wrong notes weighted for higher frequency
- [ ] Anti-clustering enforced across cycle boundaries
- [ ] Enharmonic equivalents treated as separate items when sharps/flats enabled
