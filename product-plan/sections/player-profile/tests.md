# Test Instructions: Player Profile

These test-writing instructions are **framework-agnostic**. Adapt them to your testing setup (Jest, Vitest, Playwright, Cypress, React Testing Library, etc.).

## Overview

Player Profile is a tabbed hub (Overview/Openings/Blunder Basket/Settings). It provides opening progress rollups, deep-links into Training Arena, a blunder master-detail view, and preference toggles.

---

## User Flow Tests

### Flow 1: Switch Tabs

**Scenario:** User changes tabs and sees the correct content.

**Steps:**
1. User clicks tab buttons: **"Overview"**, **"Openings"**, **"Blunder Basket"**, **"Settings"**

**Expected Results:**
- [ ] `onSelectTab` called with the tab id
- [ ] Correct panel renders for each tab (verify headings, e.g., **"Your training list"**, **"Mistake list"**, **"Preferences"**)

---

### Flow 2: Train an Opening

**Scenario:** User triggers a deep-link into Training Arena.

**Setup:**
- Provide at least 1 opening and matching opening progress

**Steps:**
1. User navigates to **Openings** tab
2. User clicks **"Train this opening"**

**Expected Results:**
- [ ] `onTrainOpening` called with opening id

---

### Flow 3: Review a Mistake (Master-Detail)

**Scenario:** User selects a mistake and retries it.

#### Success Path

**Setup:**
- Provide at least 1 `userMistakes` item

**Steps:**
1. User opens **Blunder Basket** tab
2. User clicks a mistake row
3. Detail panel shows **"Mistake Detail"**
4. User clicks **"Retry now"**

**Expected Results:**
- [ ] `onViewMistake` called with mistake id
- [ ] `onRetryMistake` called with mistake id

---

### Flow 4: Update Preferences

**Scenario:** User changes preferences and the update callback fires.

**Steps:**
1. User opens **Settings** tab
2. User toggles **"Sound"**
3. User toggles **"Move hints"**
4. User toggles **"Auto-promotion of lines"**
5. User changes Theme to **system**, **light**, or **dark**

**Expected Results:**
- [ ] `onUpdatePreferences` called with the updated `preferences` object for each change

---

## Empty State Tests

### Openings Tab Empty

**Setup:**
- `openingProgress = []`

**Expected Results:**
- [ ] Shows **"No openings yet"**
- [ ] Shows helper text **"Once you start training, your mastered and in-progress openings show up here."**

### Blunder Basket Empty

**Setup:**
- `userMistakes = []`

**Expected Results:**
- [ ] Shows **"Nothing to fix right now"**

### Mistake Detail Empty

**Setup:**
- `ui.selectedMistakeId = null`

**Expected Results:**
- [ ] Shows **"Select a mistake"**
- [ ] Shows helper text **"Pick one from the list to view details and replay it."**

---

## Edge Cases

- [ ] Handles missing opening/variation references (renders “Unknown opening/line” safely)
- [ ] Long usernames and display names truncate without overflow
- [ ] Preferences toggles remain usable on mobile layouts

---

## Accessibility Checks

- [ ] Tab buttons are keyboard reachable and indicate active state
- [ ] Buttons have clear visible labels (e.g., **"Retry now"**, **"Train this opening"**)

