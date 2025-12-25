import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { CurriculumProgression } from './CurriculumProgression'
import type {
  CurriculumProgressionProps,
  Opening,
  OpeningProgress,
  Side,
  User,
  Variation,
} from '../types'

function makeUser(overrides?: Partial<User>): User {
  return {
    id: 'user-1',
    displayName: 'Adrian',
    username: 'adrian_plays',
    avatarUrl: '/avatar.png',
    totalXp: 1200,
    level: 7,
    isPremium: false,
    ...overrides,
  }
}

function makeOpening(id: string, side: Side, overrides?: Partial<Opening>): Opening {
  return {
    id,
    name: id,
    description: 'desc',
    side,
    eco: 'C00',
    imageUrl: '/vite.svg',
    variationCount: 1,
    isPremium: false,
    ...overrides,
  }
}

function makeProgress(openingId: string, overrides?: Partial<OpeningProgress>): OpeningProgress {
  return {
    openingId,
    state: 'locked',
    masteryPercent: 0,
    xpEarned: 0,
    isInRepertoire: false,
    premiumLocked: false,
    prerequisites: { requiredLevel: 1, requiredOpenings: [] },
    lockReason: null,
    unlockedAt: null,
    masteredAt: null,
    ...overrides,
  }
}

function makeVariation(openingId: string, id: string, overrides?: Partial<Variation>): Variation {
  return {
    id,
    openingId,
    name: id,
    description: '',
    moves: 'e4 e5',
    moveCount: 2,
    difficulty: 'beginner',
    isPremium: false,
    isLocked: false,
    isInRepertoire: false,
    ...overrides,
  }
}

function renderHarness(
  partialProps: Partial<CurriculumProgressionProps> & Pick<CurriculumProgressionProps, 'openings' | 'openingProgress' | 'variations'>
) {
  const onChangeFilter = vi.fn()

  const props = {
    user: makeUser(),
    goals: { dailyReviewTarget: 10, staminaCap: 10, preferredSide: 'white' },
    ui: { activeFilter: 'all', expandedOpeningId: null },
    onChangeFilter,
    ...partialProps,
  } satisfies CurriculumProgressionProps

  function Harness() {
    const [ui, setUi] = useState(props.ui)
    return (
      <CurriculumProgression
        {...props}
        ui={ui}
        onChangeFilter={(filter) => {
          onChangeFilter(filter)
          setUi((prev) => ({ ...prev, activeFilter: filter }))
        }}
      />
    )
  }

  return { ...render(<Harness />), onChangeFilter }
}

describe('CurriculumProgression', () => {
  it('filters the openings list via tabs', async () => {
    const user = userEvent.setup()
    const openings = [
      makeOpening('opening-1', 'white', { name: "Queen's Gambit" }),
      makeOpening('opening-2', 'black', { name: 'Sicilian Defense' }),
      makeOpening('opening-3', 'white', { name: 'London System' }),
    ]
    const openingProgress = [
      makeProgress('opening-1', { state: 'mastered' }),
      makeProgress('opening-2', { state: 'unlocked' }),
      makeProgress('opening-3', { state: 'locked' }),
    ]
    const variations = [
      makeVariation('opening-1', 'var-1'),
      makeVariation('opening-2', 'var-2'),
      makeVariation('opening-3', 'var-3'),
    ]

    const { onChangeFilter } = renderHarness({ openings, openingProgress, variations })

    const filterTabs = screen.getByRole('button', { name: 'All' }).parentElement
    expect(filterTabs).not.toBeNull()

    await user.click(within(filterTabs as HTMLElement).getByRole('button', { name: 'Mastered' }))
    expect(onChangeFilter).toHaveBeenCalledWith('mastered')
    expect(screen.getByText("Queen's Gambit")).toBeInTheDocument()
    expect(screen.queryByText('Sicilian Defense')).not.toBeInTheDocument()

    await user.click(within(filterTabs as HTMLElement).getByRole('button', { name: 'White' }))
    expect(onChangeFilter).toHaveBeenCalledWith('white')
    expect(screen.getByText("Queen's Gambit")).toBeInTheDocument()
    expect(screen.getByText('London System')).toBeInTheDocument()
    expect(screen.queryByText('Sicilian Defense')).not.toBeInTheDocument()

    await user.click(within(filterTabs as HTMLElement).getByRole('button', { name: 'Black' }))
    expect(onChangeFilter).toHaveBeenCalledWith('black')
    expect(screen.getByText('Sicilian Defense')).toBeInTheDocument()
    expect(screen.queryByText('London System')).not.toBeInTheDocument()
  })

  it('navigates on card click', async () => {
    const user = userEvent.setup()
    const openings = [makeOpening('opening-1', 'white', { name: "Queen's Gambit" })]
    const openingProgress = [makeProgress('opening-1', { state: 'unlocked' })]
    const variations = [makeVariation('opening-1', 'var-1')]

    const onStartOpening = vi.fn()

    renderHarness({
      openings,
      openingProgress,
      variations,
      onStartOpening,
    })

    await user.click(screen.getByRole('button', { name: /Queen's Gambit/i }))
    expect(onStartOpening).toHaveBeenCalledWith('opening-1')
  })

  it('opens variations menu without triggering card navigation', async () => {
    const user = userEvent.setup()
    const openings = [makeOpening('opening-1', 'white', { name: "Queen's Gambit" })]
    const openingProgress = [makeProgress('opening-1', { state: 'unlocked' })]
    const variations = [makeVariation('opening-1', 'var-1', { name: 'Main Line' })]

    const onStartOpening = vi.fn()
    const onStartVariation = vi.fn()

    renderHarness({
      openings,
      openingProgress,
      variations,
      onStartOpening,
      onStartVariation,
    })

    await user.click(screen.getByRole('button', { name: 'Variations' }))
    expect(onStartOpening).not.toHaveBeenCalled()

    await user.click(screen.getByRole('menuitem', { name: 'Main Line' }))
    expect(onStartVariation).toHaveBeenCalledWith('opening-1', 'var-1')
  })

  it('shows empty state per filter and resets to All', async () => {
    const user = userEvent.setup()
    const openings = [makeOpening('opening-1', 'white', { name: "Queen's Gambit" })]
    const openingProgress = [makeProgress('opening-1', { state: 'unlocked' })]
    const variations = [makeVariation('opening-1', 'var-1')]

    const { onChangeFilter } = renderHarness({ openings, openingProgress, variations })

    await user.click(screen.getByRole('button', { name: 'Mastered' }))
    expect(screen.getByText('Nothing mastered yet')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reset to All' }))
    expect(onChangeFilter).toHaveBeenLastCalledWith('all')
  })

  it('calls goal callbacks from controls', async () => {
    const user = userEvent.setup()
    const openings = [makeOpening('opening-1', 'white')]
    const openingProgress = [makeProgress('opening-1', { state: 'unlocked' })]
    const variations = [makeVariation('opening-1', 'var-1')]

    const onSetDailyReviewTarget = vi.fn()
    const onSetStaminaCap = vi.fn()
    const onSetPreferredSide = vi.fn()

    renderHarness({
      openings,
      openingProgress,
      variations,
      onSetDailyReviewTarget,
      onSetStaminaCap,
      onSetPreferredSide,
    })

    await user.click(screen.getByRole('button', { name: 'Increase Daily review target' }))
    expect(onSetDailyReviewTarget).toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Increase Stamina cap' }))
    expect(onSetStaminaCap).toHaveBeenCalled()

    const preferredSideRow = screen.getByText('Preferred side').closest('div')?.parentElement
    expect(preferredSideRow).not.toBeNull()
    await user.click(within(preferredSideRow as HTMLElement).getByRole('button', { name: 'Black' }))
    expect(onSetPreferredSide).toHaveBeenCalledWith('black')
  })
})
