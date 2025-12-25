// =============================================================================
// Design OS Types (Training Arena)
// =============================================================================

export type Side = 'white' | 'black'

export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

export type TrainingMode = 'opening-training' | 'one-move-drill' | 'opening-drill'

export interface Opening {
    id: string
    name: string
    description: string
    side: Side
    eco: string
    imageUrl: string
    variationCount: number
    isPremium: boolean
    drill_mode_unlocked?: boolean
}

export interface Variation {
    id: string
    openingId: string
    name: string
    description: string
    moves: string
    moveCount: number
    difficulty: Difficulty
    isPremium: boolean
    isLocked: boolean
    isInRepertoire: boolean
}

export interface UserProgress {
    id: string
    variationId: string
    masteryPercent: number
    streak: number
    nextReviewDate: string | null
    interval: number
    easeFactor: number
    totalReviews: number
    correctReviews: number
    lastReviewedAt: string | null
}

export interface UserMistake {
    id: string
    variationId: string
    fen: string
    wrongMove: string
    correctMove: string
    explanation: string
    occurredAt: string
    reviewedCount: number
    lastReviewedAt: string | null
}

export interface SessionFilters {
    repertoireOnly: boolean
    wrongMoveMode: boolean
    side: Side | null
}

export interface CurrentSession {
    mode: TrainingMode
    openingId: string
    variationId: string
    movesPlayed: number
    totalMoves: number
    hintsUsed: number
    isComplete: boolean
    startedAt: string
    filters: SessionFilters
}

export interface UserStats {
    totalXp: number
    level: number
    currentStreak: number
    longestStreak: number
    staminaRemaining: number
    staminaMax: number
    dueReviews: number
    variationsLearned: number
    totalMistakes: number
    mistakesFixed: number
}

// =============================================================================
// Component Props
// =============================================================================

export interface TrainingArenaProps {
    openings: Opening[]
    variations: Variation[]
    userProgress: UserProgress[]
    userMistakes: UserMistake[]
    currentSession: CurrentSession | null
    userStats: UserStats
    isGuest?: boolean
    isPremium?: boolean

    onStartSession?: (mode: TrainingMode, openingId?: string, variationId?: string) => void
    onPlayMove?: (move: string) => void
    onRequestHint?: () => void
    onResetPosition?: () => void
    onStepBack?: () => void
    onStepForward?: () => void
    onNextSession?: () => void
    onRetrySession?: () => void

    onSelectOpening?: (openingId: string) => void
    onSelectVariation?: (variationId: string) => void
    onSwitchMode?: (mode: TrainingMode) => void

    onToggleRepertoireOnly?: (enabled: boolean) => void
    onToggleWrongMoveMode?: (enabled: boolean) => void
    onChangeSideFilter?: (side: Side | null) => void

    onReviewMistake?: (mistakeId: string) => void
    onDismissMistake?: (mistakeId: string) => void

    onStartFreeTrial?: () => void
    onSignUp?: () => void

    sessionBoard?: import('react').ReactNode
    successOverlay?: import('react').ReactNode
}
