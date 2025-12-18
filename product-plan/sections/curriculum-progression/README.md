# Curriculum & Progression

## Overview

Curriculum & Progression helps users manage their learning path by browsing openings with clear progression states (Locked/Unlocked/Mastered), unlocking new openings when eligible, and starting reviews. It also includes lightweight goals to steer training: daily review target, stamina cap, and preferred side.

## User Flows

- View openings list with filters: **All**, **Unlocked**, **Locked**, **Mastered**, **White**, **Black**
- Expand an opening to view requirements, coach note, and actions
- Unlock an opening (or see lock reasons)
- Start a review for an unlocked opening
- Adjust goals: **Daily review target**, **Stamina cap**, **Preferred side**

## Design Decisions

- Opening rows expand inline to keep the user anchored in the list.
- Lock reasons are presented as friendly coaching (“Not unlockable yet”, “Premium required”, “Ready to unlock”).
- The Goals panel is intentionally small and quick-editable.

## Data Used

**Entities (section types):**
- User, Opening, Variation, UserProgress, OpeningProgress, Goals, CurriculumUiState

**From global model:**
- User, Opening, Variation, UserProgress

## Visual Reference

If `screenshot.png` is present, use it as the target UI reference.

## Components Provided

- `CurriculumProgression` — Full section UI (filters, goals, list, expansion, empty states)

## Callback Props

| Callback | Description |
|----------|-------------|
| `onChangeFilter` | Update active list filter |
| `onToggleExpandedOpening` | Expand/collapse an opening row |
| `onUnlockOpening` | Attempt to unlock opening |
| `onStartReview` | Start a review session for an opening |
| `onSetDailyReviewTarget` | Update daily review goal |
| `onSetStaminaCap` | Update stamina cap |
| `onSetPreferredSide` | Update preferred side |
| `onStartFreeTrial` | Premium conversion action |
| `onSignUp` | Guest conversion action |

