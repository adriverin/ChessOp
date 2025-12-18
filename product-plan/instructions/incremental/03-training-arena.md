# Milestone 3: Training Arena

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestones 1-2 complete

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

Implement the Training Arena — the unified hub for learning and drilling opening lines with mode selection, filters, and in-session UX.

## Overview

Training Arena is where users spend most of their time: they pick a mode, apply quick filters, and run repeated training sessions with move validation, hints/resets, and completion actions. It also surfaces the Blunder Basket (saved mistakes) for targeted review.

**Key Functionality:**
- Select a training mode: **Opening Training**, **One Move Drill**, **Opening Drill** (premium)
- Start a session via **Quick start** with side + repertoire/wrong-move preferences
- Run an in-session loop with board area, progress, and controls (**Hint**, **Reset**, step back/forward)
- Switch openings/lines mid-session via sidebar selectors
- Review and dismiss blunders via **Blunder Basket** (**Review**, **Dismiss**)

## Recommended Approach: Test-Driven Development

Before implementing this section, **write tests first** based on the test specifications provided.

See `product-plan/sections/training-arena/tests.md` for detailed test-writing instructions including:
- Key user flows to test (success and failure paths)
- Specific UI elements, button labels, and interactions to verify
- Expected behaviors and assertions

## What to Implement

### Components

Copy the section components from `product-plan/sections/training-arena/components/`:

- `TrainingArena` — Main section surface (entry state vs active session)
- `ModePicker` / `ModeCard` / `StatChip` — Mode selection cards with stats
- `QuickStartPanel` — Quick start filters + **Start session**
- `TrainingSession` — In-session layout (board + sidebar)
- `BoardControls` — **Hint**, **Reset**, step back/forward
- `CompletionBanner` — Completion overlay (**Next Line**, **Try Again**, **Switch Training Mode**)
- `SessionSidebar` — Mode/opening/line selectors + filters + move list
- `SessionProgress` — Inline progress indicator
- `BlunderBasket` — Mistake list and actions

### Data Layer

The components expect the data shapes in `product-plan/sections/training-arena/types.ts` (Openings, Variations, UserProgress, UserMistakes, CurrentSession, UserStats).

You'll need to:
- Create API endpoints (or equivalent) to fetch openings/variations/progress/mistakes
- Persist per-user progress (SRS) and mistakes (Blunder Basket)
- Implement session state transitions (start → play moves → complete → next/retry)

### Callbacks

Wire up these user actions from `TrainingArenaProps`:

- `onStartSession(mode, openingId?, variationId?)`
- `onPlayMove(move)`
- `onRequestHint()`, `onResetPosition()`, `onStepBack()`, `onStepForward()`
- `onNextSession()`, `onRetrySession()`
- `onSelectOpening(openingId)`, `onSelectVariation(variationId)`, `onSwitchMode(mode)`
- `onToggleRepertoireOnly(enabled)`, `onToggleWrongMoveMode(enabled)`, `onChangeSideFilter(side|null)`
- `onReviewMistake(mistakeId)`, `onDismissMistake(mistakeId)`
- `onStartFreeTrial()`, `onSignUp()`

### Empty States

Implement empty state UI for:

- **No mistakes yet:** Blunder Basket shows **"No mistakes saved"**
- **No openings match filters:** Quick start opening selector includes **"No openings match"**
- **Out of stamina (non-premium):** show **"⚡ Out of stamina"** and disable **"Start session"**
- **Premium required:** show **"🔒 This line is Premium"** and offer **"Start free trial"**
- **Progression lock:** show **"🔒 Train all variations to unlock"**

## Files to Reference

- `product-plan/sections/training-arena/README.md` — Feature overview and design intent
- `product-plan/sections/training-arena/tests.md` — Test-writing instructions (use for TDD)
- `product-plan/sections/training-arena/components/` — React components
- `product-plan/sections/training-arena/types.ts` — TypeScript interfaces
- `product-plan/sections/training-arena/sample-data.json` — Test data
- `product-plan/sections/training-arena/screenshot.png` — Visual reference (if provided)

## Done When

- [ ] Tests written for key user flows (success and failure paths)
- [ ] All tests pass
- [ ] Components render with real data
- [ ] Empty states display properly when no records exist
- [ ] All user actions work and callbacks are wired
- [ ] Responsive on mobile

