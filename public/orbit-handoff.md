# ORBIT — Engineering Handoff (single block)

> Product: **Orbit** — a laptop-first floating desk for sequential work.
> Status: working interactive prototype. No auth. No backend. localStorage persist.
> Owner intent: internal company desk. Visual language = Linear density + Raycast command bar + glass widgets.
> Language of UI: English. Audience: one person at a laptop.
> Date: 2026-08-26.

This file is the complete handoff. Paste it into Claude / Cursor / v0 / a new repo and continue from here. Do not invent a kanban board. The core object is **a task with a custom ordered step list**.

---

## 1. One-sentence product

Orbit is a dark glass dashboard where each todo has a **title**, a **user-defined sequence of steps**, a **checkbox that swipes the task to the next step**, a **scratchpad for questions/extra work**, a **per-task progress bar made of those checkboxes**, a **⌘K command palette**, a **focus timer (max 60 min)**, **quick links**, and **add/remove widgets**. Every keystroke auto-saves.

## 2. What it is NOT

- Not a shared team kanban (no Idea → Design → Dev → QA → Done columns).
- Not mobile-first. Laptop is the product. Small screens should not explode, but do not spend time on a phone UI.
- Not a markdown WYSIWYG. Notes are a plain autosaving textarea.
- Not multiplayer, not login, not Notion/Jira sync.
- Not a generic drag-and-drop bento builder. Widgets toggle on/off and reorder. Task cards do not drag.

## 3. Core interaction (non-negotiable)

```
Create task
  → type title (autosave)
  → add Step 1, Enter, Step 2, Enter, Step 3… (listed in order)
  → Current step shows a custom checkbox
  → Click checkbox → spring check → card/step SWIPES to the next step
  → Scratchpad on the selected task for questions / extra work
  → When every step is checked → task is Done
  → Progress = filled step checkboxes / total steps (segmented bar)
```

Checkbox meaning: **advance one step**, not “mark the whole task complete”.
Unchecking a done step reopens it (becomes current if it is the earliest incomplete).
Future steps cannot be skipped by checking them.

## 4. Information architecture

Laptop layout (1280×800 target):

```
┌─────────────────────────────────────────────────────────────┐
│  Top bar (glass)  Logo  Orbit  ⌘K hint  Saved  clock  ⚙  New │
├───────────────────────────────┬─────────────────────────────┤
│  Filter: Active | Done | All  │  Widgets (scroll)           │
│  Task stream (scroll)         │   Focus timer               │
│   card                        │   Quick links               │
│   card (selected = expanded)  │   Today                     │
│   card                        │   Shortcuts (optional)      │
│                               │   Activity (optional)       │
├───────────────────────────────┴─────────────────────────────┤
│  Scratchpad dock (selected task notes, autosave)            │
└─────────────────────────────────────────────────────────────┘
```

- Selected card expands the full step chip list + “Add step” input.
- Unselected cards show title, segmented progress, and the current-step hero only.
- Notes dock is always for the selected task.
- Customize panel (grid icon or ⌘K) toggles/reorders widgets.

## 5. Features (shipped)

### 5.1 Tasks
- Linear-style ID `ORB-{n}`.
- Owner initials (seeded LG / JK / MN; new tasks default `LG`).
- Inline title input, autosave on every character.
- Hover: focus-timer pin, delete.
- Filters: Active (has an incomplete step OR zero steps), Done (all steps done and length > 0), All.
- Empty states for Active and Done.

### 5.2 Steps
- Ordered list, user-authored titles.
- Segmented progress bar at top of card: done = lime, current = violet, future = faint.
- Hero row: “Current step” + large custom checkbox. Completing plays a 160ms check, then Framer Motion (`motion/react`) wait-mode swipe (x ±36px, blur, 280ms, ease `[0.22, 1, 0.36, 1]`).
- Expanded chip row: each step is editable, removable; current chip has violet ring; done chips are lime-checked; add-step field at the end, Enter commits and keeps focus so you can keep listing.
- Completing the last step swaps hero to “All steps finished”.

### 5.3 Scratchpad
- Bottom glass panel.
- Placeholder: questions, blockers, extra work that shows up mid-flight.
- `⌘/Ctrl+Enter` advances the current step while focused in the textarea.
- Autosave on every keystroke.

### 5.4 Autosave
- Zustand persist, key `orbit-desk-v1`, `localStorage`, `skipHydration: true` then `rehydrate()` on mount (120ms failsafe).
- Header “Saved” with a lime dot flash on any store write.
- Timer ticks are NOT persisted every frame. Persist start/pause/reset/duration only. Running timer uses `endsAt` timestamp.

### 5.5 Command palette (⌘K / Ctrl+K)
- cmdk, glass overlay, groups: Actions / Tasks / Widgets / Links.
- Actions: New task, Complete current step, Start/Pause timer, Customize widgets.
- Tasks: fuzzy jump through active tasks.
- Widgets: Add/Hide each catalog item.
- Links: open Slack, Drive, Notion, Claude in a new tab.
- Esc / backdrop click closes.

### 5.6 Keyboard
| Key | Action | When typing in input? |
|---|---|---|
| ⌘K / Ctrl+K | Toggle palette | Always |
| Esc | Close palette / customize | Always |
| N | New task + focus title | No |
| C or Enter | Complete current step of selected | No (textarea: ⌘Enter instead) |
| J / ↓ | Next task | No |
| K / ↑ | Previous task | No |
| F | Start / pause timer | No |
| ⌘Enter in notes | Complete current step | Yes |

### 5.7 Focus timer
- Bound to a task (`timer.taskId`). Hover clock icon on a card to pin.
- Presets 15 / 25 / 45 / 60. Range 1–60 minutes. Hard cap 60.
- SVG ring, tabular-nums `m:ss`, Start / Pause / Reset.
- Running task card gets a violet pulse ring (`orbit-ring-pulse`).
- Hitting 0 calls `finishTimer`.

### 5.8 Quick links (default)
| Mark | Label | URL |
|---|---|---|
| Sl | Slack | https://app.slack.com |
| Dr | Drive | https://drive.google.com |
| No | Notion | https://www.notion.so |
| Cl | Claude | https://claude.ai |

### 5.9 Widget catalog (add / remove / reorder)
Default on: `timer`, `links`, `today`.
Optional: `shortcuts`, `activity`.
Customize desk: switch + up/down. Order is top-to-bottom in the right rail.

Today = % of all steps done, active count, done count.
Activity = last 40 step-completion events, show 6.

## 6. Design system

Dark only. Glassmorphism is restrained: one blur, hairline border, no neon soup.
Accents only on **active** (violet) and **done/progress** (lime).

```
bg        #070708
fg        #f2f2f3
surface   #121214
elevated  #18181b
muted     #8f8f98
subtle    #5c5c66
border    rgb(255 255 255 / 0.09)
violet    #8b5cf6   /* current, focus, palette selection */
lime      #34f1a5   /* checks, done, saved, progress fill */
danger    #fb7185   /* delete hover only */

font-sans Inter
font-mono IBM Plex Mono   /* timer, IDs, kbd */
radius    xs 4 / sm 8 / md 12 / lg 16 / xl 24 / 2xl 28
glass     bg surface 78% + blur 22px saturate 1.35 + hairline + 18px shadow
press     scale(0.96) on controls (tap utility)
```

Background: near-black + faint violet radial (top-right) + faint lime radial (bottom-left) + 3.5% noise. Not aurora, not mesh soup.

Motion: transform/opacity/blur only. Respect `prefers-reduced-motion` on the pulse. Hero swipe is the one cinematic moment.

Copy: short, plain, no emoji in chrome.

## 7. Stack (as implemented)

- TanStack Start (Vite) + React 19 + file routes (`src/routes/index.tsx` → `<OrbitApp />`)
- Tailwind CSS v4 (`src/styles.css` `@theme` tokens). No ad-hoc hex in new JSX.
- Motion (`motion/react`) for the step swipe
- Zustand + persist
- cmdk, lucide-react, Radix Switch, CVA buttons
- No database, no auth routes, no `@/lib/db` imports in the app

Key files:

```
src/styles.css
src/routes/__root.tsx          # title Orbit, Inter + IBM Plex Mono, dark html
src/routes/index.tsx
src/lib/types.ts
src/lib/seed.ts
src/lib/store.ts
src/lib/utils.ts
src/components/orbit/orbit-app.tsx
src/components/orbit/task-card.tsx
src/components/orbit/widgets.tsx
src/components/orbit/command-palette.tsx
src/components/ui/{button,input,textarea,switch}.tsx
```

Persist shape (`orbit-desk-v1`):
`tasks`, `events`, `links`, `enabledWidgets`, `selectedTaskId`, `filter`, `timer`, `nextNumber`.

## 8. Data model

```ts
type Step = { id: string; title: string; done: boolean };

type Task = {
  id: string;
  number: number;          // ORB-n
  title: string;
  notes: string;
  owner: string;           // initials
  steps: Step[];
  createdAt: number;
  updatedAt: number;
};

type TimerState = {
  taskId: string | null;
  durationSec: number;     // 60..3600
  remainingSec: number;
  running: boolean;
  endsAt: number | null;   // Date.now() + remaining while running
};

type WidgetKind = "timer" | "links" | "today" | "shortcuts" | "activity";
type FilterId = "active" | "done" | "all";
```

Complete ⇔ `steps.length > 0 && steps.every(s => s.done)`.
Current step ⇔ first `!done`.

## 9. Seed (first visit only)

ORB-14 Onboarding redesign (2/5, selected)
ORB-21 API rate limiter (1/4)
ORB-22 Payment webhook retries (1/4)
ORB-18 Q3 OKR review (0/3)
ORB-9 Incident postmortem — auth latency (2/3)
ORB-7 Design tokens v2 (4/4, Done)

`nextNumber` starts at 23. Default timer 25:00 on ORB-14, not running.

## 10. Explicitly out of scope (unless product asks)

- Auth / multi-user / server sync
- Real drag-and-drop of cards or grid resize
- Real Notion/Slack/Jira APIs
- Light mode
- Mobile as a first-class layout
- Full markdown editor
- Recurring tasks, due-date picker, comments thread
- Skip-to-done (Shift+click was discussed, not shipped)

## 11. Suggested next builds (priority)

1. Custom link editor (add/edit/delete URLs inside the links widget)
2. Step reorder (not skip) — drag chips or ⌥↑/↓
3. Export/import JSON backup
4. Optional due date on a task, shown as meta
5. If team use appears: auth + per-user rows. Until then keep localStorage.

## 12. QA checklist (already proven on the prototype)

- [x] Completing “High-fidelity screens” swipes current hero to “Eng handoff”
- [x] ⌘K / Ctrl+K opens palette
- [x] Customize desk opens, widgets toggle
- [x] Title/notes/step title persist across refresh
- [x] Timer presets + 60 min cap
- [x] Laptop 1280×800: stream scrolls, notes docked, widgets visible (timer + links + today)
- [x] No console errors on load

---

End of handoff. Implement against this file, not against a generic todo/kanban template.
