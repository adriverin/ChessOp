import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { TrainingArena } from './TrainingArena'
import type { Opening, UserMistake, UserStats, Variation } from '../types'

beforeEach(() => {
  localStorage.clear()
})

function makeBaseData() {
  const openings: Opening[] = [
    {
      id: 'opening-1',
      name: "Queen's Gambit",
      description: '',
      side: 'white',
      eco: 'D06',
      imageUrl: '',
      variationCount: 2,
      isPremium: false,
    },
  ]

  const variations: Variation[] = [
    {
      id: 'var-1',
      openingId: 'opening-1',
      name: 'QGD: Exchange Variation',
      description: '',
      moves: 'd4 d5 c4 e6 cxd5 exd5',
      moveCount: 6,
      difficulty: 'beginner',
      isPremium: false,
      isLocked: false,
      isInRepertoire: true,
    },
  ]

  const userStats: UserStats = {
    totalXp: 1200,
    level: 7,
    currentStreak: 5,
    longestStreak: 12,
    staminaRemaining: 3,
    staminaMax: 20,
    dueReviews: 0,
    variationsLearned: 0,
    totalMistakes: 0,
    mistakesFixed: 0,
  }

  const userMistakes: UserMistake[] = []

  return { openings, variations, userStats, userMistakes }
}

describe('TrainingArena (entry surface)', () => {
  it('starts a session from Quick start', async () => {
    const user = userEvent.setup()
    const onStartSession = vi.fn()
    const { openings, variations, userStats, userMistakes } = makeBaseData()

    render(
      <MemoryRouter>
        <TrainingArena
          openings={openings}
          variations={variations}
          userProgress={[]}
          userMistakes={userMistakes}
          currentSession={null}
          userStats={userStats}
          onStartSession={onStartSession}
        />
      </MemoryRouter>
    )

    expect(screen.getByText('Quick start')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /One Move Drill/i }))
    await user.click(screen.getByRole('button', { name: /Start session/i }))

    expect(onStartSession).toHaveBeenCalledTimes(1)
    expect(onStartSession).toHaveBeenCalledWith('one-move-drill', 'opening-1', undefined)
  })

  it('reviews and dismisses a blunder basket item', async () => {
    const user = userEvent.setup()
    const onReviewMistake = vi.fn()
    const onDismissMistake = vi.fn()
    const { openings, variations, userStats } = makeBaseData()

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
      },
    ]

    render(
      <MemoryRouter>
        <TrainingArena
          openings={openings}
          variations={variations}
          userProgress={[]}
          userMistakes={userMistakes}
          currentSession={null}
          userStats={userStats}
          onReviewMistake={onReviewMistake}
          onDismissMistake={onDismissMistake}
        />
      </MemoryRouter>
    )

    await user.click(screen.getByRole('button', { name: /Review/i }))
    expect(onReviewMistake).toHaveBeenCalledWith('mistake-1')

    await user.click(screen.getByRole('button', { name: /Dismiss/i }))
    expect(onDismissMistake).toHaveBeenCalledWith('mistake-1')
  })
})
