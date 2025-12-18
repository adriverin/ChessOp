# Milestone 4: Curriculum & Progression

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestones 1-3 complete

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

Implement Curriculum & Progression — an openings browser with progression states, unlocking, review launching, and lightweight training goals.

## Overview

This section helps users manage their learning path by browsing openings with clear states (Locked/Unlocked/Mastered), expanding an opening for details (requirements, coach note), unlocking when eligible, and starting reviews from the same surface. It also includes goals: daily review target, stamina cap, and preferred side.

**Key Functionality:**
- Filter openings by state and side: **All / Unlocked / Locked / Mastered / White / Black**
- Expand/collapse an opening row for details + requirements breakdown
- Unlock an opening (or show why it’s locked)
- Start a review for an unlocked opening
- Adjust goals (**Daily review target**, **Stamina cap**, **Preferred side**)

## Recommended Approach: Test-Driven Development

See `product-plan/sections/curriculum-progression/tests.md` and write tests first.

## What to Implement

### Components

Copy the section components from `product-plan/sections/curriculum-progression/components/`:

- `CurriculumProgression` — The full list UI, goals panel, filters, and expansion content

### Data Layer

The components expect:
- Openings + variations
- Per-opening rollups (`OpeningProgress`) including prerequisites and lock reasons
- Per-variation SRS (`UserProgress`)
- `Goals` and a small `ui` state object

### Callbacks

Wire up:

- `onChangeFilter(filter)`
- `onToggleExpandedOpening(openingId|null)`
- `onUnlockOpening(openingId)`
- `onStartReview(openingId)`
- `onSetDailyReviewTarget(target)`, `onSetStaminaCap(cap)`, `onSetPreferredSide(side)`
- `onStartFreeTrial()`, `onSignUp()`

### Empty States

When filters return no results, the UI renders an empty card with a **"Reset to All"** button. Titles vary by filter, including:
- **"Nothing mastered yet"**
- **"No locked openings"**
- **"No unlocked openings"**
- **"No White openings"**
- **"No Black openings"**
- **"No openings found"**

## Files to Reference

- `product-plan/sections/curriculum-progression/README.md`
- `product-plan/sections/curriculum-progression/tests.md`
- `product-plan/sections/curriculum-progression/components/`
- `product-plan/sections/curriculum-progression/types.ts`
- `product-plan/sections/curriculum-progression/sample-data.json`

## Done When

- [ ] Tests written and passing (including filters + empty states)
- [ ] Unlocking rules work (level/prereq/premium/guest)
- [ ] Review launching works
- [ ] Goal updates are persisted and reflected in UI

