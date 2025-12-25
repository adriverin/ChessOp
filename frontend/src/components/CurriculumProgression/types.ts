// =============================================================================
// Design OS Types (Curriculum & Progression)
// =============================================================================

export type Side = 'white' | 'black'

export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

export type OpeningState = 'locked' | 'unlocked' | 'mastered'

export type OpeningFilter = 'all' | 'unlocked' | 'locked' | 'mastered' | 'white' | 'black'

export type LockReasonType = 'level' | 'prerequisites' | 'premium'

export interface User {
    id: string
    displayName: string
    username: string
    avatarUrl: string
    totalXp: number
    level: number
    isPremium: boolean
}

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

export interface OpeningPrerequisite {
    openingId: string
    requiredState: OpeningState
}

export interface OpeningPrerequisites {
    requiredLevel: number
    requiredOpenings: OpeningPrerequisite[]
}

export interface LockReason {
    type: LockReasonType
    message: string
}

export interface OpeningProgress {
    openingId: string
    state: OpeningState
    masteryPercent: number
    xpEarned: number
    isInRepertoire: boolean
    premiumLocked: boolean
    prerequisites: OpeningPrerequisites
    lockReason: LockReason | null
    unlockedAt: string | null
    masteredAt: string | null
}

export interface Goals {
    dailyReviewTarget: number
    staminaCap: number
    preferredSide: Side
}

export interface CurriculumUiState {
    activeFilter: OpeningFilter
    expandedOpeningId: string | null
}

// =============================================================================
// Component Props
// =============================================================================

export interface CurriculumProgressionProps {
    user: User
    openings: Opening[]
    openingProgress: OpeningProgress[]
    variations: Variation[]
    goals: Goals
    ui: CurriculumUiState
    isPremium?: boolean
    showGoals?: boolean

    onChangeFilter?: (filter: OpeningFilter) => void
    onStartOpening?: (openingId: string) => void
    onStartVariation?: (openingId: string, variationId: string) => void

    onSetDailyReviewTarget?: (target: number) => void
    onSetStaminaCap?: (cap: number) => void
    onSetPreferredSide?: (side: Side) => void

    onStartFreeTrial?: () => void
    onSetGoal: (openingId: string, goal: 'learn' | 'practice' | 'master') => void
    onToggleRepertoire?: (openingId: string) => void
}
