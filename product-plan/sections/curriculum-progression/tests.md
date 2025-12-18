# Test Instructions: Curriculum & Progression

These test-writing instructions are **framework-agnostic**. Adapt them to your testing setup (Jest, Vitest, Playwright, Cypress, React Testing Library, etc.).

## Overview

This section renders an openings list with progression states, inline expansion for requirements, and actions to unlock or start reviews. It also provides goal controls and robust empty states for filters.

---

## User Flow Tests

### Flow 1: Filter the Openings List

**Scenario:** User switches filters and sees the correct subset.

**Setup:**
- Provide a mix of openings with `OpeningProgress.state` in `locked | unlocked | mastered`

**Steps:**
1. User clicks filter tabs: **"All"**, **"Unlocked"**, **"Locked"**, **"Mastered"**, **"White"**, **"Black"**

**Expected Results:**
- [ ] `onChangeFilter` called with the chosen filter id
- [ ] List shows only matching openings for each filter

---

### Flow 2: Expand an Opening and Unlock

**Scenario:** User expands an opening, sees requirements, and unlocks when eligible.

#### Success Path

**Setup:**
- `isGuest = false`
- Opening has `state = 'locked'`
- Prerequisites met, `premiumLocked = false`

**Steps:**
1. User clicks an opening row to expand
2. User sees panel label **"ACTIONS"**
3. User clicks **"Unlock opening"**

**Expected Results:**
- [ ] `onToggleExpandedOpening` called with opening id
- [ ] `onUnlockOpening` called with opening id

#### Failure Path: Guest

**Setup:**
- `isGuest = true`

**Expected Results:**
- [ ] Unlock CTA is **"Sign up to unlock"**
- [ ] Clicking calls `onSignUp`

#### Failure Path: Premium Locked

**Setup:**
- `progress.premiumLocked = true`
- `isPremium = false`

**Expected Results:**
- [ ] Lock message title shows **"Premium required"**
- [ ] CTA button shows **"Start free trial"**
- [ ] Clicking calls `onStartFreeTrial`

---

### Flow 3: Start a Review

**Scenario:** User starts a review for an unlocked opening.

#### Success Path

**Setup:**
- Opening `state = 'unlocked'`
- `isGuest = false`

**Steps:**
1. User expands an opening
2. User clicks **"Start review"**

**Expected Results:**
- [ ] `onStartReview` called with opening id

#### Failure Path: Guest

**Setup:**
- `isGuest = true`

**Expected Results:**
- [ ] CTA shows **"Sign up to start reviews"**
- [ ] Clicking calls `onSignUp`

---

## Empty State Tests

### Filtered Empty State

**Setup:**
- Choose a filter that yields no matches (e.g., `mastered` when none are mastered)

**Expected Results:**
- [ ] Empty title matches the filter (e.g., **"Nothing mastered yet"**)
- [ ] Empty card contains **"Reset to All"** button
- [ ] Clicking **"Reset to All"** calls `onChangeFilter('all')`

---

## Component Interaction Tests

### Goal Controls

**Expected Results:**
- [ ] Updating **Daily review target** calls `onSetDailyReviewTarget`
- [ ] Updating **Stamina cap** calls `onSetStaminaCap`
- [ ] Changing **Preferred side** calls `onSetPreferredSide('white'|'black')`

---

## Edge Cases

- [ ] Long descriptions truncate without breaking layout
- [ ] Prerequisites list handles 0 items and many items
- [ ] Opening progress missing for an opening still renders (uses fallback progress)

---

## Accessibility Checks

- [ ] Filter tabs are keyboard accessible
- [ ] Goal controls have accessible labels (see `aria-label` on +/- buttons)

