# Milestone 2: Application Shell

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestone 1 complete

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

Implement the application shell — the persistent navigation and layout that wraps all sections.

## What to Implement

### Shell Components

Copy the shell components from `product-plan/shell/components/` to your project:

- `AppShell.tsx` — Main layout wrapper
- `MainNav.tsx` — Navigation component (desktop + mobile)
- `UserMenu.tsx` — User menu with avatar (and "Sign In" state)

### Wire Up Navigation

Connect navigation to your routing. Target nav items:

- Training Arena → `/`
- Curriculum → `/curriculum`
- Profile → `/profile`
- Settings → `/settings`
- Help → `/help`

The components expose `onNavigate(href)` so your implementation can use any router (React Router, Next.js, Remix, etc.).

### User Menu

The user menu expects:
- User name
- Avatar URL (optional)
- Logout callback

## Files to Reference

- `product-plan/shell/README.md` — Design intent
- `product-plan/shell/components/` — React components
- `product-plan/shell/screenshot.png` — Visual reference (if provided)

## Done When

- [ ] Shell renders with navigation
- [ ] Navigation links to correct routes
- [ ] User menu shows user info (and a sign-in state)
- [ ] Responsive on mobile (hamburger menu)

