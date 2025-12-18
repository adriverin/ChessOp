# Test Instructions: Training Arena

These test-writing instructions are **framework-agnostic**. Adapt them to your testing setup (Jest, Vitest, Playwright, Cypress, React Testing Library, etc.).

## Overview

Training Arena is the primary practice surface: users select a mode, configure filters, start a session, then complete lines using in-session controls and completion actions. It also includes a Blunder Basket list with review/dismiss actions.

---

## User Flow Tests

### Flow 1: Start a Session (Quick Start)

**Scenario:** User selects a mode and starts a session from the entry screen.

#### Success Path

**Setup:**
- `currentSession = null`
- `userStats.staminaRemaining > 0`
- Provide at least 1 opening and 1 variation for that opening

**Steps:**
1. User sees header **"Quick start"**
2. User selects a mode pill (e.g., **"Opening Training"**)
3. User clicks **"Start session"**

**Expected Results:**
- [ ] `onStartSession` is called with the selected `mode`
- [ ] If an opening/line is selected, `onStartSession` receives `openingId` (and `variationId` when selected)
- [ ] **"Start session"** is disabled when `openingId` is empty

#### Failure Path: Out of Stamina (non-premium)

**Setup:**
- `userStats.staminaRemaining = 0`
- `isPremium = false`

**Expected Results:**
- [ ] UI shows **"⚡ Out of stamina"**
- [ ] **"Start session"** is disabled
- [ ] **"Start free trial"** is visible (for non-premium)

---

### Flow 2: Complete a Line and Continue

**Scenario:** User finishes a line and uses the completion banner.

#### Success Path

**Setup:**
- `currentSession.isComplete = true`

**Steps:**
1. Completion overlay appears with title **"Line Complete!"**
2. User clicks **"Next Line"**

**Expected Results:**
- [ ] `onNextSession` is called once

#### Alternate Path

**Steps:**
1. User clicks **"Try Again"**

**Expected Results:**
- [ ] `onRetrySession` is called once

---

### Flow 3: Review a Blunder Basket Item

**Scenario:** User reviews or dismisses a saved mistake.

#### Success Path

**Setup:**
- Provide `userMistakes` with at least 1 item

**Steps:**
1. User sees **"Blunder Basket"**
2. User clicks **"Review"** on an item

**Expected Results:**
- [ ] `onReviewMistake` called with the mistake id

#### Alternate Path

**Steps:**
1. User clicks **"Dismiss"** on an item

**Expected Results:**
- [ ] `onDismissMistake` called with the mistake id

---

## Empty State Tests

### Blunder Basket Empty State

**Setup:**
- `userMistakes = []`

**Expected Results:**
- [ ] Shows **"No mistakes saved"**
- [ ] Shows helper text **"When you miss a move during training, it will land here for targeted review."**

### Quick Start No Openings Match

**Setup:**
- Provide openings/variations such that current filters exclude all openings

**Expected Results:**
- [ ] Opening select includes option **"No openings match"**
- [ ] **"Start session"** is disabled when no opening is selectable

---

## Component Interaction Tests

### `BoardControls`

**User interactions:**
- [ ] Clicking **"Hint"** calls `onRequestHint`
- [ ] Clicking **"Reset"** calls `onResetPosition`
- [ ] Step back/forward buttons call `onStepBack` / `onStepForward`
- [ ] When `isComplete = true`, controls are disabled

### `SessionSidebar`

**User interactions:**
- [ ] Changing **Training Mode** select calls `onSwitchMode`
- [ ] Changing **Opening** select calls `onSelectOpening`
- [ ] Changing **Line** select calls `onSelectVariation`
- [ ] Clicking **"Reveal All"** reveals move list (if implemented via real state)
- [ ] Toggling **"Repertoire Only"** calls `onToggleRepertoireOnly`
- [ ] Toggling **"Wrong Move Mode"** calls `onToggleWrongMoveMode`
- [ ] Clicking side buttons (**"Both"**, **"♔ White"**, **"♚ Black"**) calls `onChangeSideFilter`

---

## Edge Cases

- [ ] Premium line selected while `isPremium=false` shows **"🔒 This line is Premium"** and disables start
- [ ] Progression-locked opening drill shows **"🔒 Train all variations to unlock"**
- [ ] Handles very long opening/variation names without layout break

---

## Accessibility Checks

- [ ] All buttons are reachable by keyboard
- [ ] Select inputs have visible labels (e.g., **Training Mode**, **Opening**, **Line**)
- [ ] Focus is not trapped when completion overlay appears

---

## Sample Test Data

Use `sample-data.json` and vary:

```ts
const mockUserStats = {
  totalXp: 1200,
  level: 7,
  currentStreak: 5,
  longestStreak: 12,
  staminaRemaining: 3,
  staminaMax: 10,
  dueReviews: 4,
  variationsLearned: 18,
  totalMistakes: 7,
  mistakesFixed: 3,
}
```

