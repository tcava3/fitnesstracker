# FitnessTracker — Project Specification

A single-page PWA fitness tracker with an RPG-style XP and levelling system. Users log workouts, earn XP, level up skills, complete weekly challenges, and track personal records. No backend — all data lives in `localStorage`.

---

## File Structure

```
fitnesstracker/
├── index.html          # HTML skeleton, auth screen, main app layout
├── css/
│   └── styles.css      # All styling (CSS variables, components, responsive)
├── js/
│   ├── state.js        # XP math, localStorage helpers, freshState()
│   ├── auth.js         # Login, register, session management
│   ├── skills.js       # XP formulas, calcXp functions, renderSkills()
│   ├── log.js          # Tab switching, form handling, logExercise(), calendar, day modal
│   ├── prs.js          # Personal records system, showPage()
│   ├── challenges.js   # Weekly challenge system, templates, progress tracking
│   ├── gpx.js          # GPX file import, parsing, confirmation modal
│   ├── profile.js      # Profile (height/weight/BMI), goals list
│   └── sw.js           # PWA service worker registration (inline blob)
└── SPEC.md             # This file
```

---

## Data Model

All user data is stored in `localStorage` under the key `fs_data_<username>` (lowercase).

### Top-level state object (`state`)

```js
{
  skills: {
    str: { name: 'Strength', icon: '💪', xp: 0 },
    run: { name: 'Running',  icon: '🏃', xp: 0 },
    swm: { name: 'Swimming', icon: '🏊', xp: 0 },
    cyc: { name: 'Cycling',  icon: '🚴', xp: 0 },
    spt: { name: 'Sports',   icon: '⚽', xp: 0 },
  },
  log: [],          // array of LogEntry objects
  activities: 0,    // total count of logged activities
  challenges: null, // ChallengesState object (see below)
  prs: {},          // Personal Records map (see below)
  profile: { height: '', weight: '' },
  goals: [],        // array of { id, text, done }
}
```

### LogEntry

```js
{
  id: number,       // Date.now() + Math.random() — unique
  skill: 'run',     // one of: str, run, swm, cyc, spt
  exercise: string, // e.g. "Outdoor Run", "Back Squat"
  detail: string,   // human-readable summary e.g. "5km in 25 min (5:00/km)"
  xp: number,
  time: string,     // "HH:MM" — time of logging
  date: string,     // "YYYY-MM-DD"
  prValue: number,  // value used for PR comparison (weight kg / distance km / duration min)
  prUnit: string,   // 'kg', 'km', or 'min'
  fromGpx: bool,    // true if imported via GPX
}
```

### Personal Records (`state.prs`)

A flat map keyed by exercise name or pace-bracket key.

- **Strength / Cycling / Swimming / Sports**: keyed by exercise name (e.g. `"Back Squat"`). Value = `{ skill, value, unit, detail, date }` where value is the best `prValue`.
- **Running**: keyed as `"Run PR: 5 km"` etc. Value = `{ skill: 'run', value: paceMinKm, unit: '/km', detail, date, ispacePR: true, bracket }`. **Lower value = better** (fastest pace).

Standard running distance brackets: `1 km`, `3 km`, `5 km`, `10 km`, `Half Marathon`, `Marathon`. Only exact-distance runs (within tolerance) set a pace PR.

### ChallengesState

```js
{
  week: '2026-W12',     // ISO week key — resets when week changes
  chosen: {             // selected challenge ID per skill (null = not chosen yet)
    str: 'challengeId', run: null, swm: null, cyc: null, spt: null
  },
  progress: {           // cumulative progress keyed by challenge ID
    's1': 1500
  },
  completed: {          // boolean per skill
    str: false, run: false, swm: false, cyc: false, spt: false
  },
  weekLog: [],          // array of "skill-DayString" for unique-day tracking
}
```

---

## XP System

Uses a compressed OSRS-style formula. Max level is 50.

```js
function xpForLevel(level) // cumulative XP required for level
function levelFromXp(xp)   // current level from XP
function xpToNextLevel(xp) // XP remaining to next level
function progressPercent(xp) // 0–100 progress within current level
```

### XP Formulas per skill

| Skill | Formula |
|-------|---------|
| Strength | `sets × reps × weight(kg) × 0.08` |
| Running | `distance × 30 × intensity × paceBonus` (bonus: <6min/km = 1.2×, <8min/km = 1.0×, else 0.85×) |
| Swimming | `(distance × 60 + duration × 0.8) × intensity` |
| Cycling | `(distance × 10 + duration × 0.3) × intensity` |
| Sports | `duration × 1.2 × intensity` |

Intensity multipliers: Easy=1.0, Moderate=1.2, Hard=1.5, Max/Race=1.8.

---

## Skills

Five skills: `str`, `run`, `swm`, `cyc`, `spt`. Each has a colour defined as a CSS variable:

| Key | Name | Colour var |
|-----|------|-----------|
| str | Strength | `--str-color` (#e05050) |
| run | Running | `--run-color` (#50c878) |
| swm | Swimming | `--swm-color` (#5090e0) |
| cyc | Cycling | `--cyc-color` (#e0a030) |
| spt | Sports | `--spt-color` (#c060e0) |

---

## Challenges

Weekly challenges reset every Monday. Each skill has 4 challenge templates in `CHALLENGE_TEMPLATES` (in `challenges.js`). Templates are tier-scaled by current level (<10 = Beginner, <25 = Intermediate, <40 = Advanced, 40+ = Elite).

Challenge metrics: `volume` (kg), `sessions` (count), `reps`, `heavy` (single heavy set), `distance` (km), `duration` (cumulative minutes), `single_duration` (one session must hit target), `days` (unique days in week).

User selects one challenge per skill per week. Two-step confirmation flow: tap to preview (pending state) → tap Confirm to lock in.

---

## Running Pace Features

- `formatPace(minPerKm)` → `"5:30"` string
- `runDistanceBracket(d)` → bracket label or null (tolerances: ±0.1km for 5/10km, ±0.2km for half/marathon)
- `runPRKey(bracket)` → `"Run PR: 5 km"` key for prs map
- Live pace display shown in the running form as user types distance + duration
- Quick-set preset buttons: 5km, 10km, Half, Marathon

---

## GPX Import

Located in `gpx.js`. Flow:
1. User clicks "Import GPX" button → file picker
2. `handleGpxUpload()` reads file, calls `parseGpx()`
3. `parseGpx()` uses `DOMParser` on the XML, computes:
   - Distance via haversine formula across all `<trkpt>` elements
   - Duration from first/last `<time>` timestamps
   - Elevation gain by summing positive `<ele>` differences
   - Skill detection from `<type>` tag → speed heuristic fallback
4. Confirm modal shown with detected stats, editable skill/exercise/intensity/date
5. `confirmGpxLog()` runs same path as manual `logExercise()` including PR and challenge updates

---

## Auth

Local-only. Passwords hashed with djb2 (`hashStr()`). Accounts stored in `localStorage` under `fs_accounts`. Sessions stored in `sessionStorage` under `fs_session` — auto-resumed on page reload within same tab.

**Not secure for production** — this is a local personal tracker only.

---

## Pages

Three pages toggled by `showPage(page)`:
- `dashboard` — skill cards, stats bar, log form, weekly challenges, activity calendar
- `pr` — personal records tables per skill
- `profile` — body stats (height/weight/BMI), goals list

Nav bar is sticky (CSS `position: sticky; top: 0`).

---

## CSS Architecture

All colour tokens defined as CSS variables in `:root` (in `styles.css`). Dark theme throughout. Two fonts: `Cinzel` (serif, headings/labels) and `Crimson Text` (serif, body).

Key component classes:
- `.skill-card.{skill}` — skill overview cards
- `.skill-tab.{skill}` — log form tab buttons  
- `.challenge-card.{skill}` — weekly challenge cards
- `.cal-dot.{skill}` — calendar activity dots
- `.day-entry-dot.{skill}` — day modal entry dots
- `.pr-section.{skill}` — personal records section headers

All skill-specific colour rules follow the pattern `.{skill} .component` or `.component.{skill}`.

---

## Adding a New Skill

To add a new skill (e.g. `hik` for Hiking):

1. **`state.js`** — add to `freshState()` skills object
2. **`state.js`** — add `Object.assign` restoration in `startSession()`
3. **`css/styles.css`** — add `--hik-color` and `--hik-dark` CSS variables
4. **`css/styles.css`** — add colour rules for `.skill-card.hik::before`, `.hik .skill-icon`, `.hik .xp-bar-fill`, `.skill-tab.active.hik`, `.challenge-card.hik`, `.challenge-card.hik .challenge-skill-badge`, `.challenge-card.hik .challenge-progress-fill`, `.challenge-modal-skill-label.hik`, `.cal-dot.hik`, `.day-entry-dot.hik`, `.pr-section.hik .pr-section-header h3`
5. **`index.html`** — add tab button, form HTML, PR section HTML
6. **`skills.js`** — add `calcHikXp()` formula, add to `XP_FORMULAS`, add to `setTab()` forEach, add to `getPreviewXp()`, add to saved-tab validation array
7. **`log.js`** — add branch in `logExercise()`
8. **`challenges.js`** — add templates to `CHALLENGE_TEMPLATES`, add to `getChallengesState()` chosen/completed, add to `renderChallenges()` arrays
9. **`prs.js`** — add to `renderPR()` sections/headers/emptyMsg arrays
10. **`gpx.js`** — add to `GPX_EXERCISE_OPTIONS`, add to skill detection logic, add branch in `confirmGpxLog()`

---

## Known Limitations / Future Work

- No progress charts (pace over time, volume over time)
- No weekly volume summary on dashboard
- No goal race support (target race with countdown)
- Swimming form doesn't support sets/laps/pool-length
- No stroke-specific pace PRs for swimming (fastest 100m freestyle etc.)
- Cycling XP ignores elevation gain (available in GPX but not used)
- No training load / fatigue tracking
- Intensity selector is coarse (4 options) — no heart rate zones or RPE scale
- PRs only tracked for standard running distances — non-standard distances don't get pace PRs
- No data export beyond the raw localStorage JSON
