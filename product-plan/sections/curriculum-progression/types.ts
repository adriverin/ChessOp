// =============================================================================
// Data Types
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
    /** The signed-in user viewing the curriculum */
    user: User
    /** The list of openings to display */
    openings: Opening[]
    /** The opening-specific rollups used to render row state and expansion content */
    openingProgress: OpeningProgress[]
    /** Variations for openings (used for mastery rollups and review launching) */
    variations: Variation[]
    /** SRS + mastery tracking for individual variations */
    userProgress: UserProgress[]
    /** Training goals and preferences */
    goals: Goals
    /** Local UI state for previewing the screen design */
    ui: CurriculumUiState
    /** Whether the user is a guest (not logged in) */
    isGuest?: boolean
    /** Whether the user has premium access */
    isPremium?: boolean

    // === List + Expansion Actions ===
    /** Called when user changes the active filter */
    onChangeFilter?: (filter: OpeningFilter) => void
    /** Called when user expands/collapses an opening row */
    onToggleExpandedOpening?: (openingId: string | null) => void

    // === Unlock + Review Actions ===
    /** Called when user clicks Unlock on an opening */
    onUnlockOpening?: (openingId: string) => void
    /** Called when user clicks Start Review on an opening */
    onStartReview?: (openingId: string) => void

    // === Goal Actions ===
    /** Called when user updates daily review target */
    onSetDailyReviewTarget?: (target: number) => void
    /** Called when user updates stamina cap */
    onSetStaminaCap?: (cap: number) => void
    /** Called when user updates preferred side */
    onSetPreferredSide?: (side: Side) => void

    // === Auth + Premium Actions ===
    /** Called when user clicks to start a free trial */
    onStartFreeTrial?: () => void
    /** Called when user wants to sign up (guest prompts) */
    onSignUp?: () => void
}
