import { useMemo, useState, type ReactNode } from 'react'
import { BatteryCharging, ChevronDown, Crown, Sparkles, Swords, Target, Star } from 'lucide-react'
import type {
    CurriculumProgressionProps,
    Opening,
    OpeningFilter,
    OpeningProgress,
    OpeningState,
    Side,
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
    return Math.max(0, Math.min(100, Math.round(value)))
}

function formatSide(side: Side) {
    return side === 'white' ? 'White' : 'Black'
}

function stateTone(state: OpeningState) {
    if (state === 'locked') return 'amber'
    return 'emerald'
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

function ProgressBar({
    value,
    tone,
}: {
    value: number
    tone: 'emerald' | 'amber'
}) {
    const pct = safePercent(value)
    return (
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-800/60 ring-1 ring-inset ring-slate-200/70 dark:ring-slate-700/50">
            <div
                className={cx(
                    'h-full rounded-full transition-[width] duration-500',
                    tone === 'emerald' ? 'bg-emerald-600' : 'bg-amber-500'
                )}
                style={{ width: `${pct}%` }}
            />
        </div>
    )
}

function ToneChip({
    tone,
    children,
}: {
    tone: 'emerald' | 'amber' | 'slate'
    children: ReactNode
}) {
    return (
        <span
            className={cx(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
                tone === 'emerald' &&
                'bg-emerald-50 text-emerald-700 ring-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900/60',
                tone === 'amber' &&
                'bg-amber-50 text-amber-800 ring-amber-200/70 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900/60',
                tone === 'slate' &&
                'bg-slate-100 text-slate-700 ring-slate-200/70 dark:bg-slate-900/50 dark:text-slate-200 dark:ring-slate-700/60'
            )}
        >
            {children}
        </span>
    )
}

function OpeningCard({
    opening,
    progress,
    variations,
    onStartOpening,
    onStartVariation,
    onSetGoal,
    onToggleRepertoire,
}: {
    opening: Opening
    progress: OpeningProgress
    variations: Variation[]
    onStartOpening?: (openingId: string) => void
    onStartVariation?: (openingId: string, variationId: string) => void
    onSetGoal: (openingId: string, goal: 'learn' | 'practice' | 'master') => void
    onToggleRepertoire?: (openingId: string) => void
}) {
    const [menuOpen, setMenuOpen] = useState(false)
    const isLocked = progress.state === 'locked'
    const tone = stateTone(progress.state)
    const mastery = safePercent(progress.masteryPercent)
    const imageUrl = opening.imageUrl?.trim()
    const hasImage = Boolean(imageUrl)

    return (
        <div
            role="button"
            tabIndex={0}
            aria-label={opening.name}
            aria-disabled={isLocked}
            onClick={() => {
                setMenuOpen(false)
                if (isLocked) return
                onStartOpening?.(opening.id)
            }}
            onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setMenuOpen(false)
                    if (isLocked) return
                    onStartOpening?.(opening.id)
                }
            }}
            className={cx(
                "group w-full rounded-2xl bg-white/70 dark:bg-slate-950/40 ring-1 ring-inset ring-slate-200/80 hover:ring-slate-300/80 dark:ring-slate-800 dark:hover:ring-slate-700 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400/40 dark:focus:ring-emerald-500/40",
                isLocked ? "opacity-60 grayscale cursor-not-allowed" : "cursor-pointer"
            )}
        >
            <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                        <div className="h-12 w-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 ring-1 ring-inset ring-slate-200/70 dark:ring-slate-800">
                            {hasImage ? (
                                <img
                                    src={imageUrl ?? ''}
                                    alt={opening.name}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-slate-500 dark:text-slate-300">
                                    <Swords className="h-5 w-5" strokeWidth={2} />
                                </div>
                            )}
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                    {opening.name}
                                </p>
                                <ToneChip tone="slate">{formatSide(opening.side)}</ToneChip>
                                {opening.eco && (
                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                        {opening.eco}
                                    </span>
                                )}
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onToggleRepertoire?.(opening.id)
                                    }}
                                    className={cx(
                                        'ml-1 -my-1 p-1 rounded-full transition-colors',
                                        progress.isInRepertoire
                                            ? 'text-amber-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                                            : 'text-slate-300 hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    )}
                                >
                                    <Star className={cx('h-4 w-4', progress.isInRepertoire && 'fill-current')} />
                                </button>
                            </div>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                                {opening.description}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="relative">
                            <button
                                type="button"
                                disabled={isLocked}
                                onClick={(event) => {
                                    event.stopPropagation()
                                    if (isLocked) return
                                    setMenuOpen((prev) => !prev)
                                }}
                                aria-haspopup="menu"
                                aria-expanded={menuOpen}
                                className={cx(
                                    "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100/70 hover:bg-slate-200/80 dark:bg-slate-900/50 dark:text-slate-200 dark:hover:bg-slate-900 ring-1 ring-inset ring-slate-200/70 dark:ring-slate-700/60 transition-colors",
                                    isLocked && "opacity-60 cursor-not-allowed hover:bg-slate-100/70 hover:text-slate-600 dark:hover:bg-slate-900/50"
                                )}
                            >
                                Variations
                                <ChevronDown
                                    className={cx(
                                        'h-4 w-4 transition-transform',
                                        menuOpen && 'rotate-180'
                                    )}
                                />
                            </button>
                            {menuOpen && !isLocked && (
                                <div
                                    role="menu"
                                    onClick={(event) => event.stopPropagation()}
                                    className="absolute right-0 z-10 mt-2 w-56 rounded-xl bg-white dark:bg-slate-950 ring-1 ring-inset ring-slate-200/80 dark:ring-slate-800 shadow-lg overflow-hidden"
                                >
                                    {variations.length === 0 ? (
                                        <div className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
                                            No variations yet
                                        </div>
                                    ) : (
                                        <div className="py-1">
                                            {variations.map((variation) => (
                                                <button
                                                    key={variation.id}
                                                    type="button"
                                                    role="menuitem"
                                                    onClick={(event) => {
                                                        event.stopPropagation()
                                                        if (isLocked) return
                                                        onStartVariation?.(opening.id, variation.id)
                                                        setMenuOpen(false)
                                                    }}
                                                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900/60 transition-colors"
                                                >
                                                    {variation.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-4">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                            Mastery
                        </p>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">
                            {mastery}%
                        </p>
                    </div>
                    <div className="mt-2">
                        <ProgressBar value={mastery} tone={tone === 'amber' ? 'amber' : 'emerald'} />
                    </div>
                    <div className="mt-3 text-xs text-slate-600 dark:text-slate-300">
                        {opening.variationCount} variations
                    </div>
                </div>
            </div>
        </div>
    )
}

function emptyTitle(filter: OpeningFilter) {
    if (filter === 'mastered') return 'Nothing mastered yet'
    if (filter === 'locked') return 'No locked openings'
    if (filter === 'unlocked') return 'No unlocked openings'
    if (filter === 'white') return 'No White openings'
    if (filter === 'black') return 'No Black openings'
    if (filter === 'all') return 'No openings found'
    return 'No openings found'
}

function EmptyState({
    activeFilter,
    onReset,
}: {
    activeFilter: OpeningFilter
    onReset?: () => void
}) {
    return (
        <div className="rounded-2xl bg-white dark:bg-slate-950 ring-1 ring-inset ring-slate-200/80 dark:ring-slate-800 shadow-sm p-8 text-center">
            <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-900/60 dark:text-slate-200 ring-1 ring-inset ring-slate-200/70 dark:ring-slate-700/60">
                <Sparkles className="h-6 w-6" strokeWidth={2} />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                {emptyTitle(activeFilter)}
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Try a different filter or unlock your next opening to keep progressing.
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
    goals,
    ui,
    isPremium,
    showGoals = true,
    onChangeFilter,
    onStartOpening,
    onStartVariation,
    onSetDailyReviewTarget,
    onSetStaminaCap,
    onSetPreferredSide,
    onStartFreeTrial,
    onSetGoal,
    onToggleRepertoire,
}: CurriculumProgressionProps) {
    const premium = isPremium ?? user.isPremium

    const progressByOpeningId = useMemo(() => {
        const map = new Map<string, OpeningProgress>()
        for (const p of openingProgress) map.set(p.openingId, p)
        return map
    }, [openingProgress])

    const variationsByOpeningId = useMemo(() => {
        const map = new Map<string, Variation[]>()
        for (const v of variations) {
            const list = map.get(v.openingId) ?? []
            list.push(v)
            map.set(v.openingId, list)
        }
        return map
    }, [variations])

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


    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950">
            <div className="relative">
                <div className="pointer-events-none absolute inset-0 opacity-70 dark:opacity-50 bg-[radial-gradient(800px_circle_at_20%_-10%,rgba(16,185,129,0.18),transparent_55%),radial-gradient(700px_circle_at_110%_0%,rgba(245,158,11,0.16),transparent_45%)]" />
                <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-6 sm:pb-8">
                    <div className="rounded-2xl bg-white/70 dark:bg-slate-950/40 ring-1 ring-inset ring-slate-200/70 dark:ring-slate-800 shadow-sm overflow-hidden">
                        <div className="p-5 sm:p-6">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">
                                        CURRICULUM &amp; PROGRESSION
                                    </p>
                                    <h1 className="mt-1 text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
                                        Openings Repertoire
                                    </h1>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                    <FilterTabs value={ui.activeFilter} onChange={onChangeFilter} />
                                </div>
                            </div>
                        </div>
                        <div className="border-t border-slate-200/70 dark:border-slate-800">
                            <div className={cx('grid gap-6 p-5 sm:p-6', showGoals && 'lg:grid-cols-12')}>
                                {showGoals && (
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
                                                        <Crown
                                                            className="h-4 w-4 text-amber-700 dark:text-amber-200 mt-0.5"
                                                            strokeWidth={2}
                                                        />
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
                                )}

                                <div className={cx(showGoals ? 'lg:col-span-8' : 'lg:col-span-12')}>
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

                                    <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
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
                                                    lockReason:
                                                        opening.isPremium && !premium
                                                            ? { type: 'premium', message: 'Premium required for this opening.' }
                                                            : { type: 'level', message: 'Locked.' },
                                                    unlockedAt: null,
                                                    masteredAt: null,
                                                } satisfies OpeningProgress
                                                const openingVariations = variationsByOpeningId.get(opening.id) ?? []

                                                return (
                                                    <OpeningCard
                                                        key={opening.id}
                                                        opening={opening}
                                                        progress={progress}
                                                        variations={openingVariations}
                                                        onStartOpening={onStartOpening}
                                                        onStartVariation={onStartVariation}
                                                        onSetGoal={onSetGoal}
                                                        onToggleRepertoire={onToggleRepertoire}
                                                    />
                                                )
                                            })
                                        )}
                                    </div>
                                    <p className="mt-5 text-xs text-slate-500 dark:text-slate-400">
                                        Tip: set a small daily target, review consistently, then expand your repertoire.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
