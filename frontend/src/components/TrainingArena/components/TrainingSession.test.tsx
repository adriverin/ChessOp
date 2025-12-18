import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { TrainingSession } from './TrainingSession'
import type { CurrentSession, Opening, UserStats, Variation } from '../types'

function makeBase() {
  const openings: Opening[] = [
    {
      id: 'opening-1',
      name: "Queen's Gambit",
      description: '',
      side: 'white',
      eco: 'D06',
      imageUrl: '',
      variationCount: 1,
      isPremium: false,
    },
    {
      id: 'opening-2',
      name: 'Sicilian Defense',
      description: '',
      side: 'black',
      eco: 'B20',
      imageUrl: '',
      variationCount: 1,
      isPremium: false,
    },
  ]

  const variations: Variation[] = [
    {
      id: 'var-1',
      openingId: 'opening-1',
      name: 'QGD: Exchange Variation',
      description: 'Test line',
      moves: 'd4 d5 c4 e6',
      moveCount: 4,
      difficulty: 'beginner',
      isPremium: false,
      isLocked: false,
      isInRepertoire: true,
    },
    {
      id: 'var-2',
      openingId: 'opening-2',
      name: 'Sicilian: Najdorf',
      description: 'Test line 2',
      moves: 'e4 c5 Nf3 d6',
      moveCount: 4,
      difficulty: 'intermediate',
      isPremium: false,
      isLocked: false,
      isInRepertoire: false,
    },
  ]

  const currentSession: CurrentSession = {
    mode: 'opening-training',
    openingId: 'opening-1',
    variationId: 'var-1',
    movesPlayed: 2,
    totalMoves: 4,
    hintsUsed: 0,
    isComplete: false,
    startedAt: new Date('2025-12-18T10:00:00.000Z').toISOString(),
    filters: {
      repertoireOnly: true,
      wrongMoveMode: false,
      side: null,
    },
  }

  const userStats: UserStats = {
    totalXp: 1200,
    level: 7,
    currentStreak: 5,
    longestStreak: 12,
    staminaRemaining: 3,
    staminaMax: 10,
    dueReviews: 0,
    variationsLearned: 0,
    totalMistakes: 0,
    mistakesFixed: 0,
  }

  return { openings, variations, currentSession, userStats }
}

function Harness({
  onSwitchMode,
  onSelectOpening,
  onSelectVariation,
  onToggleRepertoireOnly,
  onToggleWrongMoveMode,
  onChangeSideFilter,
}: {
  onSwitchMode?: (mode: CurrentSession['mode']) => void
  onSelectOpening?: (openingId: string) => void
  onSelectVariation?: (variationId: string) => void
  onToggleRepertoireOnly?: (enabled: boolean) => void
  onToggleWrongMoveMode?: (enabled: boolean) => void
  onChangeSideFilter?: (side: CurrentSession['filters']['side']) => void
}) {
  const base = makeBase()
  const [session, setSession] = useState<CurrentSession>(base.currentSession)

  return (
    <TrainingSession
      openings={base.openings}
      variations={base.variations}
      currentSession={session}
      userStats={base.userStats}
      onSwitchMode={(mode) => {
        onSwitchMode?.(mode)
        setSession((prev) => ({ ...prev, mode }))
      }}
      onSelectOpening={(openingId) => {
        onSelectOpening?.(openingId)
        setSession((prev) => {
          const firstVariationForOpening =
            base.variations.find((v) => v.openingId === openingId)?.id ?? prev.variationId
          return { ...prev, openingId, variationId: firstVariationForOpening }
        })
      }}
      onSelectVariation={(variationId) => {
        onSelectVariation?.(variationId)
        setSession((prev) => ({ ...prev, variationId }))
      }}
      onToggleRepertoireOnly={(enabled) => {
        onToggleRepertoireOnly?.(enabled)
        setSession((prev) => ({
          ...prev,
          filters: { ...prev.filters, repertoireOnly: enabled },
        }))
      }}
      onToggleWrongMoveMode={(enabled) => {
        onToggleWrongMoveMode?.(enabled)
        setSession((prev) => ({
          ...prev,
          filters: { ...prev.filters, wrongMoveMode: enabled },
        }))
      }}
      onChangeSideFilter={(side) => {
        onChangeSideFilter?.(side)
        setSession((prev) => ({
          ...prev,
          filters: { ...prev.filters, side },
        }))
      }}
      board={<div>Board</div>}
    />
  )
}

describe('TrainingSession', () => {
  it('shows completion overlay and triggers next/retry callbacks', async () => {
    const user = userEvent.setup()
    const onNextSession = vi.fn()
    const onRetrySession = vi.fn()
    const { openings, variations, currentSession, userStats } = makeBase()

    render(
      <TrainingSession
        openings={openings}
        variations={variations}
        currentSession={{ ...currentSession, isComplete: true }}
        userStats={userStats}
        onNextSession={onNextSession}
        onRetrySession={onRetrySession}
        board={<div>Board</div>}
      />
    )

    expect(screen.getByText('Line Complete!')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Next Line' }))
    expect(onNextSession).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Try Again' }))
    expect(onRetrySession).toHaveBeenCalledTimes(1)
  })

  it('wires board controls callbacks', async () => {
    const user = userEvent.setup()
    const onRequestHint = vi.fn()
    const onResetPosition = vi.fn()
    const onStepBack = vi.fn()
    const onStepForward = vi.fn()
    const { openings, variations, currentSession, userStats } = makeBase()

    render(
      <TrainingSession
        openings={openings}
        variations={variations}
        currentSession={currentSession}
        userStats={userStats}
        onRequestHint={onRequestHint}
        onResetPosition={onResetPosition}
        onStepBack={onStepBack}
        onStepForward={onStepForward}
        board={<div>Board</div>}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Hint' }))
    expect(onRequestHint).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Reset' }))
    expect(onResetPosition).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: /Step back/i }))
    expect(onStepBack).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: /Step forward/i }))
    expect(onStepForward).toHaveBeenCalledTimes(1)
  })

  it('wires sidebar selectors and filter actions', async () => {
    const user = userEvent.setup()
    const onSwitchMode = vi.fn()
    const onSelectOpening = vi.fn()
    const onSelectVariation = vi.fn()
    const onToggleRepertoireOnly = vi.fn()
    const onToggleWrongMoveMode = vi.fn()
    const onChangeSideFilter = vi.fn()

    render(
      <Harness
        onSwitchMode={onSwitchMode}
        onSelectOpening={onSelectOpening}
        onSelectVariation={onSelectVariation}
        onToggleRepertoireOnly={onToggleRepertoireOnly}
        onToggleWrongMoveMode={onToggleWrongMoveMode}
        onChangeSideFilter={onChangeSideFilter}
      />
    )

    await user.selectOptions(screen.getByLabelText('Training Mode'), 'one-move-drill')
    expect(onSwitchMode).toHaveBeenCalledWith('one-move-drill')

    await user.selectOptions(screen.getByLabelText('Opening'), 'opening-2')
    expect(onSelectOpening).toHaveBeenCalledWith('opening-2')

    await user.selectOptions(screen.getByLabelText('Line'), 'var-2')
    expect(onSelectVariation).toHaveBeenCalledWith('var-2')

    await user.click(screen.getByRole('button', { name: 'Both' }))
    expect(onChangeSideFilter).toHaveBeenCalledWith(null)

    await user.click(screen.getByRole('button', { name: '♔ White' }))
    expect(onChangeSideFilter).toHaveBeenCalledWith('white')

    await user.click(screen.getByRole('button', { name: '♚ Black' }))
    expect(onChangeSideFilter).toHaveBeenCalledWith('black')

    await user.click(screen.getByRole('switch', { name: 'Repertoire Only' }))
    expect(onToggleRepertoireOnly).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('switch', { name: 'Wrong Move Mode' }))
    expect(onToggleWrongMoveMode).toHaveBeenCalledTimes(1)
  })
})
