# ChessOp — Product Overview

## Summary

ChessOp is the "Duolingo for Chess Openings"—a gamified, scientifically-backed training platform that helps players from absolute beginners to club experts build and retain a bulletproof repertoire using spaced repetition and interactive drills.

## Planned Sections

1. **Training Arena** — The core interactive board for learning and drilling opening lines with move validation.
2. **Curriculum & Progression** — The backend system for spaced repetition (SRS), unlocking new openings, and tracking XP.
3. **Player Profile** — A dedicated hub for viewing stats, streaks, badges, and reviewing mistakes in the "Blunder Basket".

## Data Model

Core entities:
- User
- Opening
- Variation
- UserProgress
- UserMistake
- DailyQuest
- Badge

## Design System

**Colors:**
- Primary: emerald
- Secondary: amber
- Neutral: slate

**Typography:**
- Heading: Space Grotesk
- Body: Inter
- Mono: JetBrains Mono

## Implementation Sequence

Build this product in milestones:

1. **Foundation** — Set up design tokens and data model types
2. **Shell** — Implement the application shell and navigation
3. **Training Arena** — Learning/drilling session UX with modes, filters, and completion actions
4. **Curriculum & Progression** — Openings list, progression states, unlocking, and goal controls
5. **Player Profile** — Stats hub with tabs, opening progress, blunder basket review, and preferences

Each milestone has a dedicated instruction document in `product-plan/instructions/`.

