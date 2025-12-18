import { useMemo, type ReactNode } from 'react'
import {
    BatteryCharging,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Crown,
    Lock,
    Sparkles,
    Swords,
    Target,
} from 'lucide-react'
import type {
    CurriculumProgressionProps,
    Goals,
    Opening,
    OpeningFilter,
    OpeningProgress,
    OpeningState,
    Side,
    User,
    UserProgress,
    Variation,
} from '../types'

function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ')
}

function clampInt(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, Math.round(value)))
}

function safePercent(value: number) {
    if (!Number.isFinite(value)) return 0
    return Math.max(0, Math.min(100, value))
}

function formatSide(side: Side) {
    return side === 'white' ? 'White' : 'Black'
}

function stateLabel(state: OpeningState) {
    return state === 'locked' ? 'Locked' : state === 'unlocked' ? 'Unlocked' : 'Mastered'
}

function stateTone(state: OpeningState) {
    if (state === 'locked') return 'amber'
    if (state === 'unlocked') return 'emerald'
    return 'slate'
}

function isDue(dateIso: string | null, now: number) {
    if (!dateIso) return false
    const t = new Date(dateIso).getTime()
    if (!Number.isFinite(t)) return false
    return t <= now
}

function FilterTabs({
    value,
    onChange,
}: {
    value: OpeningFilter
    onChange?: (filter: OpeningFilter) => void
}) {
    const filters: Array<{ id: OpeningFilter; label: string }> = [
        { id: 'all', label: 'All' },
        { id: 'unlocked', label: 'Unlocked' },
        { id: 'locked', label: 'Locked' },
        { id: 'mastered', label: 'Mastered' },
        { id: 'white', label: 'White' },
        { id: 'black', label: 'Black' },
    ]

    return (
        <div className="inline-flex items-center rounded-xl bg-slate-100/80 dark:bg-slate-900/40 ring-1 ring-inset ring-slate-200/80 dark:ring-slate-700/60 p-1">
            {filters.map((f) => {
                const active = f.id === value
                return (
                    <button
                        key={f.id}
                        onClick={() => onChange?.(f.id)}
                        className={cx(
                            'relative inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                            active
                                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 dark:bg-slate-950 dark:text-white dark:ring-slate-700'
                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                        )}
                    >
                        {f.label}
                    </button>
                )
            })}
        </div>
    )
}

function GoalNumber({
    label,
    hint,
    icon,
    value,
    min,
    max,
    onChange,
}: {
    label: string
    hint: string
    icon: ReactNode
    value: number
    min: number
    max: number
    onChange?: (next: number) => void
}) {
    const clamped = clampInt(value, min, max)
    return (
        <div className="rounded-xl bg-white/70 dark:bg-slate-950/40 ring-1 ring-inset ring-slate-200/80 dark:ring-slate-800 p-3">
            <div className="flex items-start gap-3">
                <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900/50">
                    {icon}
                </div>
                <div className="min-w-0">
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                {label}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                                {hint}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => onChange?.(clampInt(clamped - 1, min, max))}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-900 ring-1 ring-inset ring-slate-200/70 dark:ring-slate-700/60 transition-colors"
                                aria-label={`Decrease ${label}`}
                            >
                                −
                            </button>
                            <input
                                value={clamped}
                                onChange={(e) => onChange?.(clampInt(Number(e.target.value), min, max))}
                                inputMode="numeric"
                                className="h-9 w-16 rounded-lg bg-white text-center text-sm font-semibold text-slate-900 ring-1 ring-inset ring-slate-200/80 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 dark:bg-slate-950 dark:text-white dark:ring-slate-700/70 dark:focus:ring-emerald-500/40"
                            />
                            <button
                                onClick={() => onChange?.(clampInt(clamped + 1, min, max))}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-900 ring-1 ring-inset ring-slate-200/70 dark:ring-slate-700/60 transition-colors"
                                aria-label={`Increase ${label}`}
                            >
                                +
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function SideToggle({
    value,
    onChange,
}: {
    value: Side
    onChange?: (side: Side) => void
}) {
    return (
        <div className="inline-flex items-center rounded-xl bg-slate-100/80 dark:bg-slate-900/40 ring-1 ring-inset ring-slate-200/80 dark:ring-slate-700/60 p-1">
            {(['white', 'black'] as const).map((side) => {
                const active = value === side
                return (
                    <button
                        key={side}
                        onClick={() => onChange?.(side)}
                        className={cx(
                            'inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                            active
                                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 dark:bg-slate-950 dark:text-white dark:ring-slate-700'
                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                        )}
                    >
                        {formatSide(side)}
                    </button>
                )
            })}
        </div>
    )
}

function Metric({
    label,
    value,
}: {
    label: string
    value: React.ReactNode
}) {
    return (
        <div className="rounded-lg bg-slate-50/70 dark:bg-slate-950/40 ring-1 ring-inset ring-slate-200/70 dark:ring-slate-800 px-3 py-2">
            <p className="text-[11px] font-semibold tracking-wide text-slate-500 dark:text-slate-400">
                {label.toUpperCase()}
            </p>
            <div className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white">
                {value}
            </div>
        </div>
    )
}

function ProgressBar({
    value,
    tone,
}: {
    value: number
    tone: 'emerald' | 'amber' | 'slate'
}) {
    const pct = safePercent(value)
    return (
        <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-900/70 ring-1 ring-inset ring-slate-200/70 dark:ring-slate-800 overflow-hidden">
            <div
                className={cx(
                    'h-full rounded-full transition-[width] duration-500',
                    tone === 'emerald' && 'bg-gradient-to-r from-emerald-500 to-emerald-600',
                    tone === 'amber' && 'bg-gradient-to-r from-amber-400 to-amber-500',
                    tone === 'slate' && 'bg-gradient-to-r from-slate-400 to-slate-500'
                )}
                style={{ width: `${pct}%` }}
            />
        </div>
    )
}

function OpeningCard({
    user,
    isGuest,
    isPremium,
    opening,
    progress,
    goals,
    dueReviews,
    isExpanded,
    openingsById,
    progressByOpeningId,
    onToggleExpanded,
    onUnlockOpening,
    onStartReview,
    onStartFreeTrial,
    onSignUp,
}: {
    user: User
    isGuest: boolean
    isPremium: boolean
    opening: Opening
    progress: OpeningProgress
    goals: Goals
    dueReviews: number
    isExpanded: boolean
    openingsById: Map<string, Opening>
    progressByOpeningId: Map<string, OpeningProgress>
    onToggleExpanded?: (openingId: string | null) => void
    onUnlockOpening?: (openingId: string) => void
    onStartReview?: (openingId: string) => void
    onStartFreeTrial?: () => void
    onSignUp?: () => void
}) {
    const tone = stateTone(progress.state)
    const mastery = safePercent(progress.masteryPercent)

    const prerequisitesMet = useMemo(() => {
        if (user.level < progress.prerequisites.requiredLevel) return false
        for (const req of progress.prerequisites.requiredOpenings) {
            const current = progressByOpeningId.get(req.openingId)?.state ?? 'locked'
            const ok =
                req.requiredState === 'unlocked'
                    ? current === 'unlocked' || current === 'mastered'
                    : current === req.requiredState
            if (!ok) return false
        }
        return true
    }, [progress.prerequisites.requiredLevel, progress.prerequisites.requiredOpenings, progressByOpeningId, user.level])

    const eligibleToUnlock =
        progress.state === 'locked' &&
        !isGuest &&
        !progress.premiumLocked &&
        prerequisitesMet &&
        !!onUnlockOpening

    return (
        <div className={cx(
            'rounded-2xl bg-white dark:bg-slate-950 ring-1 ring-inset ring-slate-200/80 dark:ring-slate-800 shadow-sm overflow-hidden',
            isExpanded && 'shadow-md'
        )}>
            <button
                onClick={() => onToggleExpanded?.(isExpanded ? null : opening.id)}
                className="w-full text-left"
            >
                <div className="p-4 sm:p-5">
                    <div className="flex items-start gap-4">
                        <div className="relative shrink-0">
                            <div className="h-12 w-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 ring-1 ring-inset ring-slate-200/70 dark:ring-slate-800">
                                {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */}
                                <img
                                    src={opening.imageUrl}
                                    alt={opening.name}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                />
                            </div>
                            {opening.isPremium && (
                                <div className="absolute -right-2 -top-2 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm ring-1 ring-inset ring-amber-400/60">
                                    <Crown className="h-3 w-3" strokeWidth={2} />
                                    Premium
                                </div>
                            )}
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                        {formatSide(opening.side)} • {opening.eco}
                                    </p>
                                    <h3 className="mt-0.5 text-base sm:text-lg font-semibold text-slate-900 dark:text-white truncate">
                                        {opening.name}
                                    </h3>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    {progress.isInRepertoire && (
                                        <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200 px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ring-emerald-100/80 dark:ring-emerald-900/40">
                                            <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
                                            In repertoire
                                        </span>
                                    )}
                                    <span className={cx(
                                        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset',
                                        tone === 'emerald' && 'bg-emerald-50 text-emerald-700 ring-emerald-100/80 dark:bg-emerald-950/30 dark:text-emerald-200 dark:ring-emerald-900/40',
                                        tone === 'amber' && 'bg-amber-50 text-amber-800 ring-amber-100/80 dark:bg-amber-950/25 dark:text-amber-200 dark:ring-amber-900/40',
                                        tone === 'slate' && 'bg-slate-100 text-slate-700 ring-slate-200/80 dark:bg-slate-900/40 dark:text-slate-200 dark:ring-slate-700/60',
                                    )}>
                                        {progress.state === 'mastered' ? (
                                            <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
                                        ) : progress.state === 'locked' ? (
                                            <Lock className="h-3.5 w-3.5" strokeWidth={2} />
                                        ) : (
                                            <Swords className="h-3.5 w-3.5" strokeWidth={2} />
                                        )}
                                        {stateLabel(progress.state)}
                                    </span>
                                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-600 dark:bg-slate-900/50 dark:text-slate-300 ring-1 ring-inset ring-slate-200/70 dark:ring-slate-800">
                                        {isExpanded ? (
                                            <ChevronUp className="h-4 w-4" strokeWidth={2} />
                                        ) : (
                                            <ChevronDown className="h-4 w-4" strokeWidth={2} />
                                        )}
                                    </span>
                                </div>
                            </div>

                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-5 max-h-[2.5rem] overflow-hidden">
                                {opening.description}
                            </p>

                            <div className="mt-3 grid grid-cols-3 gap-2">
                                <Metric label="Mastery" value={`${mastery}%`} />
                                <Metric label="XP Earned" value={progress.xpEarned.toLocaleString()} />
                                <Metric label="Due Today" value={dueReviews} />
                            </div>

                            <div className="mt-3">
                                <ProgressBar value={mastery} tone={tone} />
                            </div>
                        </div>
                    </div>
                </div>
            </button>

            {isExpanded && (
                <div className="border-t border-slate-200/80 dark:border-slate-800">
                    <div className="p-4 sm:p-5 bg-gradient-to-b from-slate-50/60 to-white dark:from-slate-950 dark:to-slate-950">
                        <div className="grid gap-4 lg:grid-cols-12">
                            <div className="lg:col-span-7 space-y-3">
                                <div className="rounded-xl bg-white/80 dark:bg-slate-950/50 ring-1 ring-inset ring-slate-200/70 dark:ring-slate-800 p-4">
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                        REQUIREMENTS
                                    </p>
                                    <div className="mt-3 space-y-2">
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                Level {progress.prerequisites.requiredLevel}+
                                            </p>
                                            <span className={cx(
                                                'text-xs font-semibold',
                                                user.level >= progress.prerequisites.requiredLevel
                                                    ? 'text-emerald-700 dark:text-emerald-200'
                                                    : 'text-amber-800 dark:text-amber-200'
                                            )}>
                                                {user.level >= progress.prerequisites.requiredLevel ? 'Met' : `You are level ${user.level}`}
                                            </span>
                                        </div>

                                        {progress.prerequisites.requiredOpenings.length === 0 ? (
                                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                                No prerequisite openings.
                                            </p>
                                        ) : (
                                            <div className="space-y-2">
                                                {progress.prerequisites.requiredOpenings.map((req) => {
                                                    const requiredOpening = openingsById.get(req.openingId)
                                                    const current = progressByOpeningId.get(req.openingId)?.state ?? 'locked'
                                                    const satisfied =
                                                        req.requiredState === 'unlocked'
                                                            ? current === 'unlocked' || current === 'mastered'
                                                            : current === req.requiredState

                                                    return (
                                                        <div
                                                            key={req.openingId}
                                                            className="flex items-center justify-between gap-3 rounded-lg bg-slate-50/70 dark:bg-slate-950/40 ring-1 ring-inset ring-slate-200/70 dark:ring-slate-800 px-3 py-2"
                                                        >
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                                                    {requiredOpening?.name ?? req.openingId}
                                                                </p>
                                                                <p className="text-xs text-slate-600 dark:text-slate-300">
                                                                    Needs to be {stateLabel(req.requiredState)}
                                                                </p>
                                                            </div>
                                                            <span className={cx(
                                                                'text-xs font-semibold',
                                                                satisfied
                                                                    ? 'text-emerald-700 dark:text-emerald-200'
                                                                    : 'text-amber-800 dark:text-amber-200'
                                                            )}>
                                                                {satisfied ? 'Met' : `Currently ${stateLabel(current)}`}
                                                            </span>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {progress.state === 'locked' && (
                                    <div className={cx(
                                        'rounded-xl p-4 ring-1 ring-inset',
                                        progress.premiumLocked
                                            ? 'bg-amber-50 ring-amber-100/80 dark:bg-amber-950/20 dark:ring-amber-900/40'
                                            : progress.lockReason
                                                ? 'bg-slate-50 ring-slate-200/70 dark:bg-slate-950/50 dark:ring-slate-800'
                                                : 'bg-emerald-50 ring-emerald-100/80 dark:bg-emerald-950/20 dark:ring-emerald-900/40'
                                    )}>
                                        <div className="flex items-start gap-3">
                                            <div className={cx(
                                                'mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-inset',
                                                progress.premiumLocked
                                                    ? 'bg-amber-100 text-amber-800 ring-amber-200/70 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900/50'
                                                    : progress.lockReason
                                                        ? 'bg-slate-100 text-slate-700 ring-slate-200/70 dark:bg-slate-900/50 dark:text-slate-200 dark:ring-slate-700/60'
                                                        : 'bg-emerald-100 text-emerald-800 ring-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900/50'
                                            )}>
                                                {progress.premiumLocked ? (
                                                    <Crown className="h-4 w-4" strokeWidth={2} />
                                                ) : progress.lockReason ? (
                                                    <Lock className="h-4 w-4" strokeWidth={2} />
                                                ) : (
                                                    <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    {progress.premiumLocked
                                                        ? 'Premium required'
                                                        : progress.lockReason
                                                            ? 'Not unlockable yet'
                                                            : 'Ready to unlock'}
                                                </p>
                                                <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">
                                                    {progress.premiumLocked
                                                        ? (progress.lockReason?.message ?? `Upgrade to unlock ${opening.name}.`)
                                                        : progress.lockReason
                                                            ? progress.lockReason.message
                                                            : 'You meet the requirements—unlock to add it to your path.'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="lg:col-span-5 space-y-3">
                                <div className="rounded-xl bg-white/80 dark:bg-slate-950/50 ring-1 ring-inset ring-slate-200/70 dark:ring-slate-800 p-4">
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                        ACTIONS
                                    </p>
                                    <div className="mt-3 grid gap-2">
                                        {progress.state === 'locked' ? (
                                            <>
                                                {isGuest ? (
                                                    <button
                                                        onClick={() => onSignUp?.()}
                                                        className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 ring-1 ring-inset ring-emerald-500/60 shadow-sm transition-colors"
                                                    >
                                                        Sign up to unlock
                                                    </button>
                                                ) : progress.premiumLocked && !isPremium ? (
                                                    <button
                                                        onClick={() => onStartFreeTrial?.()}
                                                        className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 ring-1 ring-inset ring-amber-400/60 shadow-sm transition-colors"
                                                    >
                                                        Start free trial
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => onUnlockOpening?.(opening.id)}
                                                        disabled={!eligibleToUnlock}
                                                        className={cx(
                                                            'inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold ring-1 ring-inset shadow-sm transition-colors',
                                                            eligibleToUnlock
                                                                ? 'text-white bg-emerald-600 hover:bg-emerald-700 ring-emerald-500/60'
                                                                : 'text-slate-400 bg-slate-100 ring-slate-200/70 cursor-not-allowed dark:bg-slate-900/60 dark:text-slate-500 dark:ring-slate-800'
                                                        )}
                                                    >
                                                        Unlock opening
                                                    </button>
                                                )}
                                                <div className="rounded-xl bg-slate-50 dark:bg-slate-950/40 ring-1 ring-inset ring-slate-200/70 dark:ring-slate-800 p-3">
                                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                        COACH NOTE
                                                    </p>
                                                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                                                        Your goal is {goals.dailyReviewTarget} reviews/day with a stamina cap of {goals.staminaCap}. Prioritize {formatSide(goals.preferredSide)} lines for consistency.
                                                    </p>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                {isGuest ? (
                                                    <button
                                                        onClick={() => onSignUp?.()}
                                                        className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 ring-1 ring-inset ring-emerald-500/60 shadow-sm transition-colors"
                                                    >
                                                        Sign up to start reviews
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => onStartReview?.(opening.id)}
                                                        className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 ring-1 ring-inset ring-emerald-500/60 shadow-sm transition-colors"
                                                    >
                                                        Start review
                                                    </button>
                                                )}

                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="rounded-xl bg-slate-50 dark:bg-slate-950/40 ring-1 ring-inset ring-slate-200/70 dark:ring-slate-800 p-3">
                                                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                            DUE REVIEWS
                                                        </p>
                                                        <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
                                                            {dueReviews}
                                                        </p>
                                                    </div>
                                                    <div className="rounded-xl bg-slate-50 dark:bg-slate-950/40 ring-1 ring-inset ring-slate-200/70 dark:ring-slate-800 p-3">
                                                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                            STATUS
                                                        </p>
                                                        <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                                                            {stateLabel(progress.state)}
                                                        </p>
                                                        <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                                                            {progress.state === 'mastered' ? 'Maintain sharpness' : 'Build to mastery'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-xl bg-white/80 dark:bg-slate-950/50 ring-1 ring-inset ring-slate-200/70 dark:ring-slate-800 p-4">
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                        SUMMARY
                                    </p>
                                    <div className="mt-3 grid grid-cols-2 gap-2">
                                        <Metric label="XP" value={progress.xpEarned.toLocaleString()} />
                                        <Metric label="Mastery" value={`${mastery}%`} />
                                    </div>
                                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                                        Preferred side: <span className="font-semibold text-slate-900 dark:text-white">{formatSide(goals.preferredSide)}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function EmptyState({
    activeFilter,
    onReset,
}: {
    activeFilter: OpeningFilter
    onReset?: () => void
}) {
    const title =
        activeFilter === 'mastered'
            ? 'Nothing mastered yet'
            : activeFilter === 'locked'
                ? 'No locked openings'
                : activeFilter === 'unlocked'
                    ? 'No unlocked openings'
                    : activeFilter === 'white'
                        ? 'No White openings'
                        : activeFilter === 'black'
                            ? 'No Black openings'
                            : 'No openings found'

    const description =
        activeFilter === 'mastered'
            ? 'Start with one unlocked opening and build momentum—mastery arrives faster than it feels.'
            : activeFilter === 'locked'
                ? 'Your curriculum is wide open. If you want more structure, set a preferred side and a daily target.'
                : 'Try another filter, or reset to All.'

    return (
        <div className="rounded-2xl bg-white dark:bg-slate-950 ring-1 ring-inset ring-slate-200/80 dark:ring-slate-800 shadow-sm p-6 sm:p-8 text-center">
            <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-200 dark:ring-emerald-900/40">
                <Target className="h-5 w-5" strokeWidth={2} />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                {title}
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {description}
            </p>
            <div className="mt-5 flex items-center justify-center gap-2">
                <button
                    onClick={onReset}
                    className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 ring-1 ring-inset ring-slate-200/70 transition-colors dark:bg-slate-900/60 dark:text-white dark:hover:bg-slate-900 dark:ring-slate-800"
                >
                    Reset to All
                </button>
            </div>
        </div>
    )
}

export function CurriculumProgression({
    user,
    openings,
    openingProgress,
    variations,
    userProgress,
    goals,
    ui,
    isGuest = false,
    isPremium,
    onChangeFilter,
    onToggleExpandedOpening,
    onUnlockOpening,
    onStartReview,
    onSetDailyReviewTarget,
    onSetStaminaCap,
    onSetPreferredSide,
    onStartFreeTrial,
    onSignUp,
}: CurriculumProgressionProps) {
    const premium = isPremium ?? user.isPremium

    const openingsById = useMemo(() => {
        const map = new Map<string, Opening>()
        for (const o of openings) map.set(o.id, o)
        return map
    }, [openings])

    const progressByOpeningId = useMemo(() => {
        const map = new Map<string, OpeningProgress>()
        for (const p of openingProgress) map.set(p.openingId, p)
        return map
    }, [openingProgress])

    const progressByVariationId = useMemo(() => {
        const map = new Map<string, UserProgress>()
        for (const p of userProgress) map.set(p.variationId, p)
        return map
    }, [userProgress])

    const variationsByOpeningId = useMemo(() => {
        const map = new Map<string, Variation[]>()
        for (const v of variations) {
            const list = map.get(v.openingId) ?? []
            list.push(v)
            map.set(v.openingId, list)
        }
        return map
    }, [variations])

    const now = useMemo(() => Date.now(), [])

    const filteredOpenings = useMemo(() => {
        const filter = ui.activeFilter
        const isMatch = (opening: Opening, progress: OpeningProgress | null) => {
            if (filter === 'all') return true
            if (filter === 'white') return opening.side === 'white'
            if (filter === 'black') return opening.side === 'black'
            if (!progress) return false
            if (filter === 'locked') return progress.state === 'locked'
            if (filter === 'unlocked') return progress.state === 'unlocked'
            if (filter === 'mastered') return progress.state === 'mastered'
            return true
        }

        return openings.filter((o) => isMatch(o, progressByOpeningId.get(o.id) ?? null))
    }, [openings, progressByOpeningId, ui.activeFilter])

    const dueByOpeningId = useMemo(() => {
        const map = new Map<string, number>()
        for (const o of openings) {
            const vars = variationsByOpeningId.get(o.id) ?? []
            let due = 0
            for (const v of vars) {
                const p = progressByVariationId.get(v.id) ?? null
                if (p && isDue(p.nextReviewDate, now)) due += 1
            }
            map.set(o.id, due)
        }
        return map
    }, [openings, now, progressByVariationId, variationsByOpeningId])

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950">
            <div className="relative">
                <div className="pointer-events-none absolute inset-0 opacity-70 dark:opacity-50 bg-[radial-gradient(800px_circle_at_20%_-10%,rgba(16,185,129,0.18),transparent_55%),radial-gradient(700px_circle_at_110%_0%,rgba(245,158,11,0.16),transparent_45%)]" />
                <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
                    <div className="rounded-2xl bg-white/70 dark:bg-slate-950/40 ring-1 ring-inset ring-slate-200/70 dark:ring-slate-800 shadow-sm overflow-hidden">
                        <div className="p-5 sm:p-6">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">
                                        CURRICULUM &amp; PROGRESSION
                                    </p>
                                    <h1 className="mt-1 text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
                                        Your opening path, tuned like a training plan
                                    </h1>
                                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                        Level <span className="font-semibold text-slate-900 dark:text-white">{user.level}</span> • {user.totalXp.toLocaleString()} XP • Preferred side: <span className="font-semibold text-slate-900 dark:text-white">{formatSide(goals.preferredSide)}</span>
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                    <FilterTabs value={ui.activeFilter} onChange={onChangeFilter} />
                                    <div className="inline-flex items-center justify-between gap-2 rounded-xl bg-slate-100/80 dark:bg-slate-900/40 ring-1 ring-inset ring-slate-200/80 dark:ring-slate-700/60 px-3 py-2">
                                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                            Daily target
                                        </p>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                            {goals.dailyReviewTarget}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="border-t border-slate-200/70 dark:border-slate-800">
                            <div className="grid gap-6 lg:grid-cols-12 p-5 sm:p-6">
                                <div className="lg:col-span-4 space-y-3">
                                    <div className="rounded-2xl bg-white/80 dark:bg-slate-950/50 ring-1 ring-inset ring-slate-200/70 dark:ring-slate-800 p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    Goals
                                                </p>
                                                <p className="text-xs text-slate-600 dark:text-slate-300">
                                                    Keep it light. Keep it daily.
                                                </p>
                                            </div>
                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200 px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ring-emerald-100/80 dark:ring-emerald-900/40">
                                                <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
                                                Signed in
                                            </span>
                                        </div>

                                        <div className="mt-4 space-y-2">
                                            <GoalNumber
                                                label="Daily review target"
                                                hint="How many reviews you aim to complete today."
                                                icon={<Target className="h-4 w-4" strokeWidth={2} />}
                                                value={goals.dailyReviewTarget}
                                                min={1}
                                                max={50}
                                                onChange={onSetDailyReviewTarget}
                                            />
                                            <GoalNumber
                                                label="Stamina cap"
                                                hint="Soft limit that prevents marathon sessions."
                                                icon={<BatteryCharging className="h-4 w-4" strokeWidth={2} />}
                                                value={goals.staminaCap}
                                                min={1}
                                                max={20}
                                                onChange={onSetStaminaCap}
                                            />
                                        </div>

                                        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 ring-1 ring-inset ring-slate-200/70 dark:ring-slate-800 px-3 py-2.5">
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    Preferred side
                                                </p>
                                                <p className="text-xs text-slate-600 dark:text-slate-300">
                                                    Bias your curriculum and review prompts.
                                                </p>
                                            </div>
                                            <SideToggle value={goals.preferredSide} onChange={onSetPreferredSide} />
                                        </div>

                                        {!premium && (
                                            <div className="mt-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 ring-1 ring-inset ring-amber-100/80 dark:ring-amber-900/40 px-3 py-2.5">
                                                <div className="flex items-start gap-2">
                                                    <Crown className="h-4 w-4 text-amber-700 dark:text-amber-200 mt-0.5" strokeWidth={2} />
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                            Premium lines are locked
                                                        </p>
                                                        <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">
                                                            Some openings require Premium to unlock and review.
                                                        </p>
                                                        <div className="mt-2">
                                                            <button
                                                                onClick={() => onStartFreeTrial?.()}
                                                                className="inline-flex items-center justify-center rounded-xl px-3.5 py-2 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 ring-1 ring-inset ring-amber-400/60 shadow-sm transition-colors"
                                                            >
                                                                Start free trial
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="lg:col-span-8">
                                    <div className="flex items-center justify-between gap-4">
                                        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                                            Openings
                                            <span className="ml-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                ({filteredOpenings.length})
                                            </span>
                                        </h2>
                                        {ui.activeFilter !== 'all' && (
                                            <button
                                                onClick={() => onChangeFilter?.('all')}
                                                className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white underline decoration-slate-300/70 dark:decoration-slate-700/70 underline-offset-4"
                                            >
                                                Clear filter
                                            </button>
                                        )}
                                    </div>

                                    <div className="mt-3 space-y-3">
                                        {filteredOpenings.length === 0 ? (
                                            <EmptyState
                                                activeFilter={ui.activeFilter}
                                                onReset={() => onChangeFilter?.('all')}
                                            />
                                        ) : (
                                            filteredOpenings.map((opening) => {
                                                const progress = progressByOpeningId.get(opening.id) ?? {
                                                    openingId: opening.id,
                                                    state: 'locked',
                                                    masteryPercent: 0,
                                                    xpEarned: 0,
                                                    isInRepertoire: false,
                                                    premiumLocked: opening.isPremium && !premium,
                                                    prerequisites: { requiredLevel: 1, requiredOpenings: [] },
                                                    lockReason: opening.isPremium && !premium
                                                        ? { type: 'premium', message: 'Premium required for this opening.' }
                                                        : { type: 'level', message: 'Locked.' },
                                                    unlockedAt: null,
                                                    masteredAt: null,
                                                } satisfies OpeningProgress

                                                const due = dueByOpeningId.get(opening.id) ?? 0
                                                const expanded = ui.expandedOpeningId === opening.id

                                                return (
                                                    <OpeningCard
                                                        key={opening.id}
                                                        user={user}
                                                        isGuest={isGuest}
                                                        isPremium={premium}
                                                        opening={opening}
                                                        progress={progress}
                                                        goals={goals}
                                                        dueReviews={due}
                                                        isExpanded={expanded}
                                                        openingsById={openingsById}
                                                        progressByOpeningId={progressByOpeningId}
                                                        onToggleExpanded={onToggleExpandedOpening}
                                                        onUnlockOpening={onUnlockOpening}
                                                        onStartReview={onStartReview}
                                                        onStartFreeTrial={onStartFreeTrial}
                                                        onSignUp={onSignUp}
                                                    />
                                                )
                                            })
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <p className="mt-5 text-xs text-slate-500 dark:text-slate-400">
                        Tip: set a small daily target, review consistently, then expand your repertoire.
                    </p>
                </div>
            </div>
        </div>
    )
}
