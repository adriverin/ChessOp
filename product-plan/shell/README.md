# Application Shell

## Overview

The application uses a **top navigation** layout designed to keep focus on training while providing fast access to the three core areas:

- Training Arena
- Curriculum
- Profile

Additional shell routes (Settings/Help) are included for completeness.

## Navigation Structure

- Training Arena → `/`
- Curriculum → `/curriculum`
- Profile → `/profile`
- Settings → `/settings`
- Help → `/help`

## Integration Notes

- `MainNav` supports desktop nav + mobile hamburger drawer.
- `AppShell` expects a `navigationItems` array and `onNavigate(href)` callback.
- `UserMenu` supports a signed-out state (renders **"Sign In"**) and a signed-in state with **"Sign Out"**.

