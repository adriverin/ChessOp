# Player Profile

## Overview

Player Profile is a tabbed hub where players monitor opening progress, review mistakes in the Blunder Basket, and adjust a few training preferences. It includes quick actions that deep-link into the Training Arena to train a selected opening or retry a mistake.

## User Flows

- Switch between tabs: **Overview**, **Openings**, **Blunder Basket**, **Settings**
- Train an opening from Overview/Openings via **"Train this opening"**
- Review blunders: list → select → detail → **"Retry now"**
- Adjust preferences: theme (system/light/dark), sound, move hints, auto-promotion

## Design Decisions

- Overview focuses on “Mastered vs In Progress” as the primary scoreboard.
- Blunder Basket uses a master-detail pattern: select on the left, detail on the right.
- Settings is intentionally small: immediate toggles + theme picker.

## Data Used

**Entities (section types):**
- User, Opening, Variation, UserProgress, OpeningProgress, UserMistake, PlayerPreferences, PlayerProfileUiState

**From global model:**
- User, Opening, Variation, UserProgress, UserMistake

## Visual Reference

If `screenshot.png` is present, use it as the target UI reference.

## Components Provided

- `PlayerProfile` — Full section UI (tabs, progress rollups, blunder basket detail, preferences)

## Callback Props

| Callback | Description |
|----------|-------------|
| `onSelectTab` | Change active tab |
| `onTrainOpening` | Deep-link to Training Arena for an opening |
| `onSelectOpening` | Select opening (if you choose to use it) |
| `onViewMistake` | Select a mistake for detail view |
| `onRetryMistake` | Deep-link to Training Arena to retry a mistake |
| `onUpdatePreferences` | Persist updated preferences |

