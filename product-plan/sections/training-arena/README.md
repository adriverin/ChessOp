# Training Arena

## Overview

Training Arena is the unified hub for practicing opening lines. Users pick a mode, apply quick filters, then drill sessions with in-session controls and completion actions. The Blunder Basket surfaces saved mistakes for targeted review (“blunder injection”).

## User Flows

- **Start training:** choose a mode and filters, then press **"Start session"**
- **In-session loop:** play moves on the board, use **Hint** / **Reset** / step back/forward, complete the line, then **Next Line** or **Try Again**
- **Switch context mid-session:** change **Training Mode**, **Opening**, or **Line** in the sidebar
- **Review mistakes:** from Blunder Basket press **Review** or remove via **Dismiss**
- **Guest experience:** sessions work but progress isn’t saved; UI shows **"Guest mode"** with **"Sign up"**
- **Gating states:** stamina limit, premium lines, and progression locks

## Design Decisions

- Two entry surfaces:
  - `ModePicker` for mode selection and mode-level stats
  - `QuickStartPanel` for fast configuration + a single primary CTA
- Completion is an overlay (`CompletionBanner`) so the user never loses context.
- “Filters” exist both at entry (Quick Start) and in-session (Sidebar) to support mid-session adjustments.

## Data Used

**Entities (section types):**
- Opening, Variation, UserProgress, UserMistake, CurrentSession, UserStats

**From global model:**
- User, Opening, Variation, UserProgress, UserMistake

## Visual Reference

If `screenshot.png` is present, use it as the target UI reference.

## Components Provided

- `TrainingArena` — Orchestrates entry vs active session
- `ModePicker` — Mode selection cards
- `QuickStartPanel` — Filters + start CTA
- `TrainingSession` — In-session layout
- `SessionSidebar` — Selectors, filters, moves
- `BoardControls` — Hint/reset and step controls
- `CompletionBanner` — End-of-line overlay
- `BlunderBasket` — Mistake list and actions

## Callback Props

| Callback | Description |
|----------|-------------|
| `onStartSession` | Start a new session for mode/opening/line |
| `onPlayMove` | Submit a move played by user |
| `onRequestHint` | Ask for a hint |
| `onResetPosition` | Reset the board/position |
| `onStepBack` / `onStepForward` | Navigate move history |
| `onNextSession` | Load next line/session |
| `onRetrySession` | Retry current line |
| `onSelectOpening` / `onSelectVariation` | Switch context mid-session |
| `onSwitchMode` | Switch training mode |
| `onToggleRepertoireOnly` / `onToggleWrongMoveMode` / `onChangeSideFilter` | Update filters |
| `onReviewMistake` / `onDismissMistake` | Blunder Basket actions |
| `onStartFreeTrial` / `onSignUp` | Premium / guest conversion actions |

