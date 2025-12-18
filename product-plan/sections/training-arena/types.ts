// =============================================================================
// Data Types
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
    /** List of available openings */
    openings: Opening[]
    /** List of variations across all openings */
    variations: Variation[]
    /** User's progress on each variation they're learning */
    userProgress: UserProgress[]
    /** User's mistakes (Blunder Basket) */
    userMistakes: UserMistake[]
    /** Current active training session */
    currentSession: CurrentSession | null
    /** User's overall stats */
    userStats: UserStats
    /** Whether the user is a guest (not logged in) */
    isGuest?: boolean
    /** Whether the user has premium access */
    isPremium?: boolean

    // === Session Actions ===
    /** Called when user starts a new training session */
    onStartSession?: (mode: TrainingMode, openingId?: string, variationId?: string) => void
    /** Called when user plays a move on the board */
    onPlayMove?: (move: string) => void
    /** Called when user requests a hint */
    onRequestHint?: () => void
    /** Called when user resets the current position */
    onResetPosition?: () => void
    /** Called when user steps back one move */
    onStepBack?: () => void
    /** Called when user steps forward one move */
    onStepForward?: () => void
    /** Called when user completes a session and wants to continue */
    onNextSession?: () => void
    /** Called when user wants to retry the current variation */
    onRetrySession?: () => void

    // === Navigation Actions ===
    /** Called when user selects a different opening mid-session */
    onSelectOpening?: (openingId: string) => void
    /** Called when user selects a different variation mid-session */
    onSelectVariation?: (variationId: string) => void
    /** Called when user switches training mode */
    onSwitchMode?: (mode: TrainingMode) => void

    // === Preference Actions ===
    /** Called when user toggles repertoire-only filter */
    onToggleRepertoireOnly?: (enabled: boolean) => void
    /** Called when user toggles wrong-move mode */
    onToggleWrongMoveMode?: (enabled: boolean) => void
    /** Called when user changes side filter */
    onChangeSideFilter?: (side: Side | null) => void

    // === Blunder Basket Actions ===
    /** Called when user wants to review a specific mistake */
    onReviewMistake?: (mistakeId: string) => void
    /** Called when user dismisses/fixes a mistake */
    onDismissMistake?: (mistakeId: string) => void

    // === Premium Actions ===
    /** Called when user clicks to start a free trial */
    onStartFreeTrial?: () => void
    /** Called when guest user wants to sign up */
    onSignUp?: () => void
}
