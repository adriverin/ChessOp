# Milestone 5: Player Profile

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestones 1-4 complete

---

## About These Instructions

**What you're receiving:**
- Finished UI designs (React components with full styling)
- Data model definitions (TypeScript types and sample data)
- UI/UX specifications (user flows, requirements, screenshots)
- Design system tokens (colors, typography, spacing)
- Test-writing instructions for each section (for TDD approach)

**What you need to build:**
- Backend API endpoints and database schema
- Authentication and authorization
- Data fetching and state management
- Business logic and validation
- Integration of the provided UI components with real data

**Important guidelines:**
- **DO NOT** redesign or restyle the provided components — use them as-is
- **DO** wire up the callback props to your routing and API calls
- **DO** replace sample data with real data from your backend
- **DO** implement proper error handling and loading states
- **DO** implement empty states when no records exist (first-time users, after deletions)
- **DO** use test-driven development — write tests first using `tests.md` instructions
- The components are props-based and ready to integrate — focus on the backend and data layer

---

## Goal

Implement Player Profile — a tabbed hub for progress, blunder review, and minimal training preferences.

## Overview

Player Profile is where users see their “scoreboard”: mastered vs in-progress openings, a quick way to train a selected opening, and a Blunder Basket tab with list → detail and **"Retry now"** deep-links into Training Arena. The Settings tab contains lightweight toggles and a theme picker.

**Key Functionality:**
- Switch tabs: **Overview**, **Openings**, **Blunder Basket**, **Settings**
- Train an opening via **"Train this opening"**
- Blunder Basket list → detail → **"Retry now"**
- Update preferences: theme (system/light/dark), sound, move hints, auto-promotion

## Recommended Approach: Test-Driven Development

See `product-plan/sections/player-profile/tests.md` and write tests first.

## What to Implement

### Components

Copy the section components from `product-plan/sections/player-profile/components/`:

- `PlayerProfile` — The full profile surface including tabs and detail panels

### Data Layer

The component expects:
- User profile (XP, level, streak, avatar)
- Openings + variations
- Per-opening rollups (mastered vs inProgress)
- Blunder Basket items
- Preferences and a small `ui` state object (activeTab, selected ids)

### Callbacks

Wire up:

- `onSelectTab(tab)`
- `onTrainOpening(openingId)`
- `onSelectOpening(openingId|null)`
- `onViewMistake(mistakeId)`
- `onRetryMistake(mistakeId)`
- `onUpdatePreferences(preferences)`

### Empty States

Cover:
- Openings tab empty: **"No openings yet"**
- Overview mastered empty: **"No mastered openings yet"**
- Overview in-progress empty: **"Nothing in progress"**
- Blunder Basket empty: **"Nothing to fix right now"**
- Blunder Basket detail empty: **"Select a mistake"**

## Files to Reference

- `product-plan/sections/player-profile/README.md`
- `product-plan/sections/player-profile/tests.md`
- `product-plan/sections/player-profile/components/`
- `product-plan/sections/player-profile/types.ts`
- `product-plan/sections/player-profile/sample-data.json`

## Done When

- [ ] Tests written and passing (tabs, empty states, callbacks)
- [ ] Deep-links to Training Arena wired (train opening / retry mistake)
- [ ] Preferences persist and update UI immediately

