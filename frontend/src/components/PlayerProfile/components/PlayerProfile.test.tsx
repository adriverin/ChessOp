import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { PlayerProfile } from './PlayerProfile'
import type {
  Opening,
  OpeningProgress,
  PlayerPreferences,
  PlayerProfileTab,
  PlayerProfileUiState,
  User,
  UserMistake,
  Variation,
} from '../types'

function makeBaseData() {
  const user: User = {
    id: 'user-1',
    displayName: 'Test Player',
    username: 'test_player',
    avatarUrl: '/vite.svg',
    totalXp: 1200,
    level: 7,
    currentStreak: 5,
    longestStreak: 12,
    isPremium: false,
  }

  const openings: Opening[] = [
    {
      id: 'opening-1',
      name: "Queen's Gambit",
      description: 'A classical d4 opening.',
      side: 'white',
      eco: 'D06',
      imageUrl: '',
      variationCount: 1,
      isPremium: false,
    },
  ]

  const variations: Variation[] = [
    {
      id: 'var-1',
      openingId: 'opening-1',
      name: 'QGD: Exchange',
      description: '',
      moves: '',
      moveCount: 0,
      difficulty: 'beginner',
      isPremium: false,
      isLocked: false,
      isInRepertoire: true,
    },
  ]

  const openingProgress: OpeningProgress[] = [
    {
      openingId: 'opening-1',
      status: 'inProgress',
      masteryPercent: 42,
      masteredVariations: 0,
      totalVariations: 1,
      lastTrainedAt: null,
      nextReviewDate: null,
    },
  ]

  const userMistakes: UserMistake[] = [
    {
      id: 'mistake-1',
      variationId: 'var-1',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      wrongMove: 'h3',
      correctMove: 'd4',
      explanation: 'Claim the center first.',
      occurredAt: '2025-12-18T09:00:00.000Z',
      reviewedCount: 0,
      lastReviewedAt: null,
      tags: [],
      note: null,
    },
  ]

  const preferences: PlayerPreferences = {
    theme: 'system',
    soundEnabled: true,
    moveHints: 'on',
    autoPromoteLines: true,
  }

  const ui: PlayerProfileUiState = {
    activeTab: 'overview',
    selectedOpeningId: null,
    selectedMistakeId: null,
  }

  return { user, openings, variations, openingProgress, userMistakes, preferences, ui }
}

function Harness({
  initialTab,
  initialSelectedMistakeId,
  openingProgressOverride,
  userMistakesOverride,
  onSelectTab,
  onTrainOpening,
  onViewMistake,
  onRetryMistake,
  onUpdatePreferences,
}: {
  initialTab: PlayerProfileTab
  initialSelectedMistakeId?: string | null
  openingProgressOverride?: OpeningProgress[]
  userMistakesOverride?: UserMistake[]
  onSelectTab?: (tab: PlayerProfileTab) => void
  onTrainOpening?: (openingId: string) => void
  onViewMistake?: (mistakeId: string) => void
  onRetryMistake?: (mistakeId: string) => void
  onUpdatePreferences?: (preferences: PlayerPreferences) => void
}) {
  const base = makeBaseData()
  const [ui, setUi] = useState<PlayerProfileUiState>({
    ...base.ui,
    activeTab: initialTab,
    selectedMistakeId: initialSelectedMistakeId ?? null,
  })
  const [preferences, setPreferences] = useState<PlayerPreferences>(base.preferences)

  return (
    <PlayerProfile
      user={base.user}
      openings={base.openings}
      variations={base.variations}
      userProgress={[]}
      openingProgress={openingProgressOverride ?? base.openingProgress}
      userMistakes={userMistakesOverride ?? base.userMistakes}
      preferences={preferences}
      ui={ui}
      onSelectTab={(tab) => {
        onSelectTab?.(tab)
        setUi((prev) => ({ ...prev, activeTab: tab }))
      }}
      onTrainOpening={onTrainOpening}
      onViewMistake={(mistakeId) => {
        onViewMistake?.(mistakeId)
        setUi((prev) => ({ ...prev, selectedMistakeId: mistakeId }))
      }}
      onRetryMistake={onRetryMistake}
      onUpdatePreferences={(next) => {
        onUpdatePreferences?.(next)
        setPreferences(next)
      }}
    />
  )
}

describe('PlayerProfile', () => {
  it('switches tabs and renders the correct panels', async () => {
    const user = userEvent.setup()
    const onSelectTab = vi.fn()

    render(<Harness initialTab="overview" onSelectTab={onSelectTab} />)

    await user.click(screen.getByRole('button', { name: 'Openings' }))
    expect(onSelectTab).toHaveBeenCalledWith('openings')
    expect(screen.getByText('Your training list')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Blunder Basket' }))
    expect(onSelectTab).toHaveBeenCalledWith('blunderBasket')
    expect(screen.getByText('Mistake list')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Settings' }))
    expect(onSelectTab).toHaveBeenCalledWith('settings')
    expect(screen.getAllByText('Preferences')[0]).toBeInTheDocument()
  })

  it('trains an opening from the Openings tab', async () => {
    const user = userEvent.setup()
    const onTrainOpening = vi.fn()

    render(<Harness initialTab="openings" onTrainOpening={onTrainOpening} />)

    await user.click(screen.getByRole('button', { name: 'Train this opening' }))
    expect(onTrainOpening).toHaveBeenCalledWith('opening-1')
  })

  it('reviews a mistake with master-detail and retries it', async () => {
    const user = userEvent.setup()
    const onViewMistake = vi.fn()
    const onRetryMistake = vi.fn()

    render(
      <Harness
        initialTab="blunderBasket"
        onViewMistake={onViewMistake}
        onRetryMistake={onRetryMistake}
      />
    )

    await user.click(screen.getByRole('button', { name: /Queen's Gambit/i }))
    expect(onViewMistake).toHaveBeenCalledWith('mistake-1')

    expect(screen.getByText('Mistake Detail')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry now' }))
    expect(onRetryMistake).toHaveBeenCalledWith('mistake-1')
  })

  it('updates preferences from the Settings tab', async () => {
    const user = userEvent.setup()
    const onUpdatePreferences = vi.fn()

    render(<Harness initialTab="settings" onUpdatePreferences={onUpdatePreferences} />)

    const switches = screen.getAllByRole('switch')
    expect(switches).toHaveLength(3)

    await user.click(switches[0])
    expect(onUpdatePreferences).toHaveBeenLastCalledWith(
      expect.objectContaining({ soundEnabled: false })
    )

    await user.click(screen.getByRole('button', { name: 'dark' }))
    expect(onUpdatePreferences).toHaveBeenLastCalledWith(
      expect.objectContaining({ theme: 'dark' })
    )
  })

  it('renders empty states for openings and blunder basket', () => {
    const first = render(<Harness initialTab="openings" openingProgressOverride={[]} />)
    expect(screen.getByText('No openings yet')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Once you start training, your mastered and in-progress openings show up here.'
      )
    ).toBeInTheDocument()

    first.unmount()
    render(<Harness initialTab="blunderBasket" userMistakesOverride={[]} />)
    expect(screen.getByText('Nothing to fix right now')).toBeInTheDocument()
  })

  it('renders mistake detail empty state when nothing is selected', () => {
    render(<Harness initialTab="blunderBasket" initialSelectedMistakeId={null} />)
    expect(screen.getByText('Select a mistake')).toBeInTheDocument()
    expect(
      screen.getByText('Pick one from the list to view details and replay it.')
    ).toBeInTheDocument()
  })

  it('handles missing opening/variation references safely', () => {
    const base = makeBaseData()
    const userMistakesOverride: UserMistake[] = [
      {
        ...base.userMistakes[0],
        id: 'mistake-unknown',
        variationId: 'var-missing',
      },
    ]

    render(
      <PlayerProfile
        user={base.user}
        openings={base.openings}
        variations={base.variations}
        userProgress={[]}
        openingProgress={base.openingProgress}
        userMistakes={userMistakesOverride}
        preferences={base.preferences}
        ui={{ ...base.ui, activeTab: 'blunderBasket', selectedMistakeId: 'mistake-unknown' }}
      />
    )

    expect(screen.getAllByText('Unknown opening')[0]).toBeInTheDocument()
    expect(screen.getAllByText(/Unknown line/).length).toBeGreaterThan(0)
  })
})
