// =============================================================================
// Design OS Types (Player Profile)
// =============================================================================

export type Side = 'white' | 'black'

export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

export type PlayerProfileTab = 'overview' | 'openings' | 'blunderBasket' | 'settings'

export type ThemePreference = 'system' | 'light' | 'dark'

export type MoveHintsPreference = 'off' | 'on'

export type OpeningProgressStatus = 'mastered' | 'inProgress'

export interface User {
    id: string
    displayName: string
    username: string
    avatarUrl: string
    totalXp: number
    level: number
    currentStreak: number
    longestStreak: number
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

export interface OpeningProgress {
    openingId: string
    status: OpeningProgressStatus
    masteryPercent: number
    masteredVariations: number
    totalVariations: number
    lastTrainedAt: string | null
    nextReviewDate: string | null
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
    tags: string[]
    note: string | null
}

export interface PlayerPreferences {
    theme: ThemePreference
    soundEnabled: boolean
    moveHints: MoveHintsPreference
    autoPromoteLines: boolean
}

export interface PlayerProfileUiState {
    activeTab: PlayerProfileTab
    selectedOpeningId: string | null
    selectedMistakeId: string | null
}

// =============================================================================
// Component Props
// =============================================================================

export interface PlayerProfileProps {
    /** The signed-in user viewing the profile */
    user: User
    /** The list of openings for the Openings tab */
    openings: Opening[]
    /** Variations across openings (used to contextualize progress and mistakes) */
    variations: Variation[]
    /** SRS + mastery tracking for individual variations */
    userProgress: UserProgress[]
    /** Per-opening rollups for rendering Mastered vs In Progress lists */
    openingProgress: OpeningProgress[]
    /** The user's mistakes (Blunder Basket) */
    userMistakes: UserMistake[]
    /** Minimal preferences for theme/sound and training behavior */
    preferences: PlayerPreferences
    /** Local UI state for previewing the design */
    ui: PlayerProfileUiState
    /** Whether the user is a guest (not logged in) */
    isGuest?: boolean
    /** Whether the user has premium access */
    isPremium?: boolean

    // === Navigation + Tab Actions ===
    /** Called when the user changes tabs */
    onSelectTab?: (tab: PlayerProfileTab) => void

    // === Openings Actions ===
    /** Called when the user clicks “Train this opening” */
    onTrainOpening?: (openingId: string) => void
    /** Called when the user selects an opening row/card */
    onSelectOpening?: (openingId: string | null) => void

    // === Blunder Basket Actions ===
    /** Called when the user opens a mistake detail view */
    onViewMistake?: (mistakeId: string) => void
    /** Called when the user clicks “Retry now” on a mistake */
    onRetryMistake?: (mistakeId: string) => void

    // === Settings Actions ===
    /** Called when the user updates preferences */
    onUpdatePreferences?: (preferences: PlayerPreferences) => void
}

