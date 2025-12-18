import type { TrainingMode, UserStats, UserProgress, Variation } from '../types'
import { ModeCard } from './ModeCard'
import { StatChip } from './StatChip'

export interface ModePickerProps {
    /** User's overall stats */
    userStats: UserStats
    /** User's progress on variations */
    userProgress: UserProgress[]
    /** Available variations */
    variations: Variation[]
    /** Whether the user is a guest */
    isGuest?: boolean
    /** Whether user has premium access */
    isPremium?: boolean

    /** Called when user selects a training mode */
    onSelectMode?: (mode: TrainingMode) => void
    /** Called when user clicks to start free trial */
    onStartFreeTrial?: () => void
    /** Called when guest wants to sign up */
    onSignUp?: () => void
}

// Icons for each mode
const BookOpenIcon = () => (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
)

const ZapIcon = () => (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
)

const TargetIcon = () => (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
)

const FlameIcon = () => (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
    </svg>
)

const ClockIcon = () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
)

const BatteryIcon = () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4a2 2 0 012-2zM22 11v2" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h4" />
    </svg>
)

const ChartIcon = () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
)

export function ModePicker({
    userStats,
    userProgress,
    variations,
    isGuest = false,
    isPremium = false,
    onSelectMode,
    onStartFreeTrial,
    onSignUp,
}: ModePickerProps) {
    // Calculate derived stats
    const averageMastery = userProgress.length > 0
        ? Math.round(userProgress.reduce((sum, p) => sum + p.masteryPercent, 0) / userProgress.length)
        : 0

    const repertoireVariations = variations.filter(v => v.isInRepertoire)

    return (
        <div className="w-full max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-10">
                <h1 className="text-3xl sm:text-4xl font-heading font-bold text-slate-900 dark:text-white mb-3">
                    Training Arena
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                    Master your openings with spaced repetition. Choose a training mode to begin.
                </p>

                {/* Quick Stats Bar */}
                <div className="mt-6 flex items-center justify-center gap-4 flex-wrap">
                    <StatChip
                        icon={<FlameIcon />}
                        label="Current Streak"
                        value={`${userStats.currentStreak} days`}
                        variant="success"
                    />
                    <StatChip
                        icon={<ChartIcon />}
                        label="Average Mastery"
                        value={`${averageMastery}%`}
                        variant={averageMastery >= 70 ? 'success' : averageMastery >= 40 ? 'warning' : 'default'}
                    />
                    <StatChip
                        icon={<BatteryIcon />}
                        label="Stamina"
                        value={`${userStats.staminaRemaining}/${userStats.staminaMax}`}
                        variant={userStats.staminaRemaining <= 2 ? 'warning' : 'default'}
                    />
                </div>
            </div>

            {/* Guest Banner */}
            {isGuest && (
                <div className="mb-8 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-center">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <div>
                            <p className="text-amber-800 dark:text-amber-200 font-medium">
                                Guest Mode Active
                            </p>
                            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                                Your progress won't be saved.{' '}
                                <button
                                    onClick={onSignUp}
                                    className="underline hover:no-underline font-medium"
                                >
                                    Sign up to track your learning
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Mode Cards Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Opening Training Mode */}
                <ModeCard
                    mode="opening-training"
                    title="Opening Training"
                    description="Learn new lines and review due variations with spaced repetition. Includes blunder injection to test weak spots."
                    icon={<BookOpenIcon />}
                    onSelect={() => onSelectMode?.('opening-training')}
                    stats={
                        <>
                            <StatChip
                                icon={<ClockIcon />}
                                label="Due Reviews"
                                value={userStats.dueReviews}
                                variant={userStats.dueReviews > 0 ? 'warning' : 'success'}
                            />
                            <StatChip
                                icon={<ChartIcon />}
                                label="Variations Learned"
                                value={userStats.variationsLearned}
                                variant="default"
                            />
                        </>
                    }
                />

                {/* One Move Drill Mode */}
                <ModeCard
                    mode="one-move-drill"
                    title="One Move Drill"
                    description="Fast-paced streak practice. See a position, play the right move. Build streaks and earn XP."
                    icon={<ZapIcon />}
                    onSelect={() => onSelectMode?.('one-move-drill')}
                    stats={
                        <>
                            <StatChip
                                icon={<FlameIcon />}
                                label="Best Streak"
                                value={userStats.longestStreak}
                                variant="success"
                            />
                            <StatChip
                                icon={<BatteryIcon />}
                                label="Stamina"
                                value={`${userStats.staminaRemaining}/${userStats.staminaMax}`}
                                variant={userStats.staminaRemaining <= 2 ? 'warning' : 'default'}
                            />
                        </>
                    }
                />

                {/* Opening Drill Mode (Premium) */}
                <ModeCard
                    mode="opening-drill"
                    title="Opening Drill"
                    description="Deep-dive into a single opening with targeted spaced repetition. Master every line."
                    icon={<TargetIcon />}
                    isPremium={true}
                    isLocked={!isPremium}
                    onSelect={() => onSelectMode?.('opening-drill')}
                    onUnlock={onStartFreeTrial}
                    stats={
                        <>
                            <StatChip
                                icon={<ChartIcon />}
                                label="Repertoire"
                                value={`${repertoireVariations.length} lines`}
                                variant="default"
                            />
                        </>
                    }
                />
            </div>

            {/* Stamina Warning */}
            {userStats.staminaRemaining === 0 && (
                <div className="mt-8 p-4 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-center">
                    <p className="text-slate-700 dark:text-slate-300 font-medium">
                        ⚡ You're out of stamina for today
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Come back tomorrow, or upgrade to Premium for unlimited training.
                    </p>
                    {!isPremium && (
                        <button
                            onClick={onStartFreeTrial}
                            className="mt-3 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
                        >
                            Start Free Trial
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}

