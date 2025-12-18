# ChessOp — Complete Implementation Instructions

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

## Test-Driven Development

Each section includes a `tests.md` file with detailed test-writing instructions. These are **framework-agnostic** — adapt them to your testing setup.

**For each section:**
1. Read `product-plan/sections/[section-id]/tests.md`
2. Write failing tests for key user flows (success and failure paths)
3. Implement the feature to make tests pass
4. Refactor while keeping tests green

---

# ChessOp — Product Overview

See `product-plan/product-overview.md`.

---

# Milestone 1: Foundation

## Goal

Set up the foundational elements: design tokens, data model types, and routing structure.

## What to Implement

### 1. Design Tokens

Configure your styling system with these tokens:

- `product-plan/design-system/tokens.css`
- `product-plan/design-system/tailwind-colors.md`
- `product-plan/design-system/fonts.md`

### 2. Data Model Types

Create TypeScript interfaces for your core entities:

- `product-plan/data-model/types.ts`
- `product-plan/data-model/README.md`
- `product-plan/data-model/sample-data.json`

### 3. Routing Structure

Create placeholder routes:

- `/` — Training Arena
- `/curriculum` — Curriculum & Progression
- `/profile` — Player Profile
- `/settings` — Settings
- `/help` — Help

## Done When

- [ ] Design tokens are configured
- [ ] Data model types are defined
- [ ] Routes exist for all sections (can be placeholder pages)

---

# Milestone 2: Application Shell

## Goal

Implement the application shell — the persistent navigation and layout that wraps all sections.

## What to Implement

### Shell Components

Copy from `product-plan/shell/components/`:

- `AppShell.tsx`
- `MainNav.tsx`
- `UserMenu.tsx`

### Wire Up Navigation

- Training Arena → `/`
- Curriculum → `/curriculum`
- Profile → `/profile`
- Settings → `/settings`
- Help → `/help`

### User Menu

The user menu expects:
- User name
- Avatar URL (optional)
- Logout callback

## Done When

- [ ] Shell renders with navigation
- [ ] Navigation links to correct routes
- [ ] User menu shows user info (and a sign-in state)
- [ ] Responsive on mobile

---

# Milestone 3: Training Arena

## Goal

Implement the Training Arena — the unified hub for learning and drilling opening lines with mode selection, filters, and in-session UX.

## What to Implement

- Copy `product-plan/sections/training-arena/components/` into your codebase.
- Wire callbacks in `TrainingArenaProps` to your routing and API calls.
- Implement gating and empty states described in `product-plan/sections/training-arena/tests.md`.

## Done When

- [ ] Training Arena tests pass
- [ ] Sessions can start, complete, retry, and continue
- [ ] Blunder Basket review/dismiss actions work

---

# Milestone 4: Curriculum & Progression

## Goal

Implement openings browsing with progression states, unlocking, reviews, and goal controls.

## What to Implement

- Copy `product-plan/sections/curriculum-progression/components/` into your codebase.
- Wire callbacks in `CurriculumProgressionProps`.
- Ensure filters + empty state **"Reset to All"** behavior works (see tests).

## Done When

- [ ] Curriculum tests pass
- [ ] Unlocking and review launching work end-to-end
- [ ] Goal controls persist and reflect correctly

---

# Milestone 5: Player Profile

## Goal

Implement the tabbed profile hub with opening progress, blunder review, and preferences.

## What to Implement

- Copy `product-plan/sections/player-profile/components/` into your codebase.
- Wire callbacks in `PlayerProfileProps`.
- Ensure deep-links (train opening / retry mistake) route to Training Arena.

## Done When

- [ ] Player Profile tests pass
- [ ] Tabs render correctly with empty states
- [ ] Preferences update and persist

