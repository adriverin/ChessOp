# ChessOp — Data Model

This folder provides a lightweight, implementation-ready model of the product’s core entities.

## Entities

- `User` — The player (XP, level, streak, premium status)
- `Opening` — A family (e.g., Sicilian Defense)
- `Variation` — A specific line inside an opening (moves, difficulty)
- `UserProgress` — Per-user SRS + mastery tracking for a variation
- `UserMistake` — Blunder Basket item saved from a failed position
- `DailyQuest` — Daily goals that drive engagement
- `Badge` — Achievement record

## Relationships

- `Opening` has many `Variation`
- `Variation` belongs to `Opening`
- `User` has many `UserProgress` (one per `Variation` being tracked)
- `UserProgress` links `User` and `Variation`
- `User` has many `UserMistake`
- `User` has many `Badge`
- `User` has many `DailyQuest`

## Notes

- Treat these as **API + database contract inputs**, not a hard schema.
- The UI components expect IDs to be stable and string-typed.
- Dates are represented as ISO strings (or `null` where applicable).

