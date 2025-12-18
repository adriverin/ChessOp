import { useMemo } from 'react'
import {
    ArrowUpRight,
    BadgeCheck,
    BookOpenCheck,
    CheckCircle2,
    ChevronRight,
    Flame,
    GraduationCap,
    Palette,
    Repeat2,
    Settings2,
    Volume2,
} from 'lucide-react'
import type {
    Opening,
    OpeningProgress,
    PlayerPreferences,
    PlayerProfileProps,
    PlayerProfileTab,
    UserMistake,
    Variation,
} from '../types'

function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ')
}

function safePercent(value: number) {
    if (!Number.isFinite(value)) return 0
    return Math.max(0, Math.min(100, Math.round(value)))
}

function formatNumber(value: number) {
    try {
        return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value)
    } catch {
        return String(value)
    }
}

function formatDateShort(iso: string | null) {
    if (!iso) return '—'
    const t = new Date(iso)
    if (!Number.isFinite(t.getTime())) return '—'
    try {
        return t.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    } catch {
        return iso.slice(0, 10)
    }
}

function sideLabel(side: 'white' | 'black') {
    return side === 'white' ? 'White' : 'Black'
}

function statusLabel(status: OpeningProgress['status']) {
    return status === 'mastered' ? 'Mastered' : 'In progress'
}

function statusTone(status: OpeningProgress['status']) {
    return status === 'mastered' ? 'emerald' : 'amber'
}

function sortOpeningProgress(items: OpeningProgress[]) {
    return items
        .slice()
        .sort((a, b) => {
            if (a.status !== b.status) return a.status === 'mastered' ? -1 : 1
            if (a.status === 'mastered') return b.masteryPercent - a.masteryPercent
            return a.masteryPercent - b.masteryPercent
        })
}

function ToneChip({
    tone,
    children,
}: {
    tone: 'emerald' | 'amber' | 'slate'
    children: React.ReactNode
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

function ProgressBar({
    value,
    tone = 'emerald',
}: {
    value: number
    tone?: 'emerald' | 'amber'
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

function TabButton({
    active,
    icon,
    label,
    onClick,
}: {
    active: boolean
    icon: React.ReactNode
    label: string
    onClick?: () => void
}) {
    return (
        <button
            onClick={onClick}
            className={cx(
                'relative inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ring-1 ring-inset focus:outline-none focus:ring-2 focus:ring-emerald-400/40 dark:focus:ring-emerald-500/40',
                active
                    ? 'bg-white text-slate-900 shadow-sm ring-slate-200 dark:bg-slate-950 dark:text-white dark:ring-slate-700'
                    : 'bg-transparent text-slate-600 hover:text-slate-900 ring-transparent hover:bg-white/60 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-950/40'
            )}
            aria-current={active ? 'page' : undefined}
            type="button"
        >
            <span
                className={cx(
                    'inline-flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-inset transition-colors',
                    active
                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-200/70 dark:bg-emerald-950/35 dark:text-emerald-200 dark:ring-emerald-900/60'
                        : 'bg-slate-100 text-slate-700 ring-slate-200/70 dark:bg-slate-900/40 dark:text-slate-200 dark:ring-slate-700/50'
                )}
            >
                {icon}
            </span>
            <span className="truncate">{label}</span>
        </button>
    )
}

function OpeningCard({
    opening,
    progress,
    onTrain,
}: {
    opening: Opening
    progress: OpeningProgress | null
    onTrain?: () => void
}) {
    const mastery = safePercent(progress?.masteryPercent ?? 0)
    const tone = progress ? statusTone(progress.status) : 'slate'
    return (
        <div className="group w-full rounded-2xl bg-white/70 dark:bg-slate-950/40 ring-1 ring-inset ring-slate-200/80 hover:ring-slate-300/80 dark:ring-slate-800 dark:hover:ring-slate-700 shadow-sm transition-colors">
            <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                {opening.name}
                            </p>
                            <ToneChip tone="slate">{sideLabel(opening.side)}</ToneChip>
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                {opening.eco}
                            </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                            {opening.description}
                        </p>
                    </div>
                    <ToneChip tone={tone === 'slate' ? 'slate' : tone}>
                        {progress ? statusLabel(progress.status) : '—'}
                    </ToneChip>
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
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <span>
                            {progress
                                ? `${progress.masteredVariations}/${progress.totalVariations} variations mastered`
                                : `${opening.variationCount} variations`}
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <span className="text-slate-400 dark:text-slate-500">Next:</span>
                            <span className="font-medium">{formatDateShort(progress?.nextReviewDate ?? null)}</span>
                        </span>
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                        Last trained: <span className="font-medium">{formatDateShort(progress?.lastTrainedAt ?? null)}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => onTrain?.()}
                        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 ring-1 ring-inset ring-emerald-500/60 shadow-sm transition-colors"
                    >
                        Train this opening
                        <ArrowUpRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}

function MistakeRow({
    mistake,
    opening,
    variation,
    selected,
    onClick,
}: {
    mistake: UserMistake
    opening: Opening | null
    variation: Variation | null
    selected: boolean
    onClick?: () => void
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cx(
                'w-full text-left rounded-xl px-3 py-3 ring-1 ring-inset transition-colors',
                selected
                    ? 'bg-emerald-50/70 ring-emerald-200/70 dark:bg-emerald-950/30 dark:ring-emerald-900/60'
                    : 'bg-white/70 ring-slate-200/80 hover:ring-slate-300/80 dark:bg-slate-950/40 dark:ring-slate-800 dark:hover:ring-slate-700'
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {opening?.name ?? 'Unknown opening'}
                        <span className="text-slate-400 dark:text-slate-500"> · </span>
                        {variation?.name ?? 'Unknown line'}
                    </p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 truncate">
                        <span className="font-medium text-amber-700 dark:text-amber-200">{mistake.wrongMove}</span>
                        <span className="px-1 text-slate-400 dark:text-slate-500">→</span>
                        <span className="font-medium text-emerald-700 dark:text-emerald-200">{mistake.correctMove}</span>
                    </p>
                </div>
                <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                    {formatDateShort(mistake.occurredAt)}
                </span>
            </div>

            <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300">
                <span className="inline-flex items-center gap-2">
                    <span className="inline-flex items-center gap-1">
                        <Repeat2 className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                        <span className="font-medium">{mistake.reviewedCount}</span>
                    </span>
                    <span className="text-slate-400 dark:text-slate-500">•</span>
                    <span>
                        Last review: <span className="font-medium">{formatDateShort(mistake.lastReviewedAt)}</span>
                    </span>
                </span>
                <ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            </div>
        </button>
    )
}

function SettingsToggle({
    icon,
    label,
    description,
    checked,
    onChange,
}: {
    icon: React.ReactNode
    label: string
    description: string
    checked: boolean
    onChange?: (next: boolean) => void
}) {
    return (
        <div className="rounded-2xl bg-white/70 dark:bg-slate-950/40 ring-1 ring-inset ring-slate-200/80 dark:ring-slate-800 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200/70 dark:bg-slate-900/50 dark:text-slate-200 dark:ring-slate-700/60">
                        {icon}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {label}
                        </p>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                            {description}
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    role="switch"
                    aria-checked={checked}
                    onClick={() => onChange?.(!checked)}
                    className={cx(
                        'relative inline-flex h-8 w-14 items-center rounded-full ring-1 ring-inset transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400/40 dark:focus:ring-emerald-500/40',
                        checked
                            ? 'bg-emerald-600 ring-emerald-500/60'
                            : 'bg-slate-200 ring-slate-300/80 dark:bg-slate-800 dark:ring-slate-700/60'
                    )}
                >
                    <span
                        className={cx(
                            'inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform',
                            checked ? 'translate-x-7' : 'translate-x-1'
                        )}
                    />
                </button>
            </div>
        </div>
    )
}

function updatePreferences<T extends keyof PlayerPreferences>(
    prefs: PlayerPreferences,
    key: T,
    value: PlayerPreferences[T]
) {
    return { ...prefs, [key]: value }
}

export function PlayerProfile({
    user,
    openings,
    variations,
    userProgress,
    openingProgress,
    userMistakes,
    preferences,
    ui,
    isGuest = false,
    isPremium = false,
    onSelectTab,
    onTrainOpening,
    onViewMistake,
    onRetryMistake,
    onUpdatePreferences,
}: PlayerProfileProps) {
    const openingsById = useMemo(() => {
        const map = new Map<string, Opening>()
        for (const o of openings) map.set(o.id, o)
        return map
    }, [openings])

    const variationsById = useMemo(() => {
        const map = new Map<string, Variation>()
        for (const v of variations) map.set(v.id, v)
        return map
    }, [variations])

    const sortedOpeningProgress = useMemo(() => sortOpeningProgress(openingProgress), [openingProgress])
    const mastered = useMemo(
        () => sortedOpeningProgress.filter(p => p.status === 'mastered'),
        [sortedOpeningProgress]
    )
    const inProgress = useMemo(
        () => sortedOpeningProgress.filter(p => p.status === 'inProgress'),
        [sortedOpeningProgress]
    )

    const totalOpenings = openingProgress.length || openings.length
    const primaryFocus = `Openings: ${mastered.length} mastered · ${inProgress.length} in progress`
    const selectedMistake = ui.selectedMistakeId
        ? userMistakes.find(m => m.id === ui.selectedMistakeId) ?? null
        : null

    const tabs: Array<{ id: PlayerProfileTab; label: string; icon: React.ReactNode }> = [
        { id: 'overview', label: 'Overview', icon: <GraduationCap className="h-4 w-4" /> },
        { id: 'openings', label: 'Openings', icon: <BookOpenCheck className="h-4 w-4" /> },
        { id: 'blunderBasket', label: 'Blunder Basket', icon: <BadgeCheck className="h-4 w-4" /> },
        { id: 'settings', label: 'Settings', icon: <Settings2 className="h-4 w-4" /> },
    ]

    const setTab = (tab: PlayerProfileTab) => onSelectTab?.(tab)
    const setPrefs = (next: PlayerPreferences) => onUpdatePreferences?.(next)

    return (
        <div className="w-full">
            <div className="relative border-b border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(16,185,129,0.12),transparent_42%),radial-gradient(circle_at_86%_10%,rgba(245,158,11,0.14),transparent_38%)] dark:bg-[radial-gradient(circle_at_18%_20%,rgba(16,185,129,0.16),transparent_42%),radial-gradient(circle_at_86%_10%,rgba(245,158,11,0.18),transparent_38%)]" />
                    <div className="absolute inset-0 opacity-[0.08] dark:opacity-[0.12] bg-[linear-gradient(90deg,rgba(15,23,42,0.18)_1px,transparent_1px),linear-gradient(rgba(15,23,42,0.18)_1px,transparent_1px)] bg-[length:22px_22px]" />
                </div>

                <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="h-12 w-12 rounded-2xl overflow-hidden ring-1 ring-inset ring-slate-200/80 dark:ring-slate-800 bg-slate-100 dark:bg-slate-900">
                                    <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                                </div>
                                <div className="absolute -bottom-2 -right-2 inline-flex items-center gap-1 rounded-full bg-white/90 dark:bg-slate-950/80 px-2 py-1 text-xs font-semibold text-slate-900 dark:text-white ring-1 ring-inset ring-slate-200/80 dark:ring-slate-800 shadow-sm">
                                    <span className="text-emerald-600 dark:text-emerald-400">Lv</span>
                                    <span>{user.level}</span>
                                </div>
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-medium tracking-wider uppercase text-slate-500 dark:text-slate-400">
                                    Player Profile
                                </p>
                                <h1 className="mt-1 text-2xl sm:text-3xl font-heading font-bold text-slate-900 dark:text-white truncate">
                                    {user.displayName}
                                </h1>
                                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 truncate">
                                    @{user.username} · {formatNumber(user.totalXp)} XP · {primaryFocus}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <ToneChip tone="slate">
                                <Flame className="h-3.5 w-3.5" />
                                {user.currentStreak} day streak
                            </ToneChip>
                            <ToneChip tone="slate">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Best {user.longestStreak}
                            </ToneChip>
                            <ToneChip tone={isPremium ? 'emerald' : 'amber'}>
                                {isPremium ? 'Premium' : 'Free'}
                            </ToneChip>
                            {isGuest && <ToneChip tone="amber">Guest</ToneChip>}
                            <ToneChip tone="slate">{formatNumber(userProgress.length)} lines tracked</ToneChip>
                        </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                Keep your repertoire sharp
                            </p>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                Mastered openings stay warm. In-progress openings get the reps.
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 overflow-x-auto">
                        <div className="inline-flex items-center gap-2 rounded-2xl bg-white/60 dark:bg-slate-950/30 ring-1 ring-inset ring-slate-200/80 dark:ring-slate-800 p-2">
                            {tabs.map(t => (
                                <TabButton
                                    key={t.id}
                                    active={ui.activeTab === t.id}
                                    icon={t.icon}
                                    label={t.label}
                                    onClick={() => setTab(t.id)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                    {ui.activeTab === 'overview' && (
                        <div className="grid gap-6 lg:grid-cols-12">
                            <div className="lg:col-span-7">
                                <div className="rounded-2xl bg-white/70 dark:bg-slate-950/40 ring-1 ring-inset ring-slate-200/80 dark:ring-slate-800 p-5 sm:p-6 shadow-sm">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <p className="text-xs font-medium tracking-wider uppercase text-slate-500 dark:text-slate-400">
                                                Repertoire Snapshot
                                            </p>
                                            <h2 className="mt-2 text-xl font-heading font-bold text-slate-900 dark:text-white">
                                                Mastered vs In Progress
                                            </h2>
                                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                                Your main scoreboard. Everything else supports this.
                                            </p>
                                        </div>
                                        <ToneChip tone="emerald">
                                            <GraduationCap className="h-3.5 w-3.5" />
                                            {mastered.length}/{totalOpenings} mastered
                                        </ToneChip>
                                    </div>

                                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                        <div className="rounded-2xl bg-slate-50/70 dark:bg-slate-950/30 ring-1 ring-inset ring-slate-200/70 dark:ring-slate-800 p-4">
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                Mastered
                                            </p>
                                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                                Confident lines. Quick review keeps them automatic.
                                            </p>
                                            <div className="mt-3 space-y-2">
                                                {mastered.slice(0, 3).map(p => {
                                                    const opening = openingsById.get(p.openingId)
                                                    if (!opening) return null
                                                    return (
                                                        <button
                                                            key={p.openingId}
                                                            type="button"
                                                            onClick={() => onTrainOpening?.(opening.id)}
                                                            className="w-full rounded-xl bg-white/80 dark:bg-slate-950/40 ring-1 ring-inset ring-slate-200/80 dark:ring-slate-800 px-3 py-2 text-left hover:ring-slate-300/80 dark:hover:ring-slate-700 transition-colors"
                                                        >
                                                            <div className="flex items-center justify-between gap-3">
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                                                        {opening.name}
                                                                    </p>
                                                                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">
                                                                        {p.masteryPercent}% · next {formatDateShort(p.nextReviewDate)}
                                                                    </p>
                                                                </div>
                                                                <ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                                                            </div>
                                                        </button>
                                                    )
                                                })}
                                                {mastered.length === 0 && (
                                                    <div className="rounded-xl bg-white/70 dark:bg-slate-950/30 ring-1 ring-inset ring-slate-200/70 dark:ring-slate-800 px-3 py-3">
                                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                            No mastered openings yet
                                                        </p>
                                                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                                            Your first mastered opening will show up here.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="rounded-2xl bg-slate-50/70 dark:bg-slate-950/30 ring-1 ring-inset ring-slate-200/70 dark:ring-slate-800 p-4">
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                In progress
                                            </p>
                                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                                Where your next gains live. Small daily reps compound fast.
                                            </p>
                                            <div className="mt-3 space-y-2">
                                                {inProgress.slice(0, 3).map(p => {
                                                    const opening = openingsById.get(p.openingId)
                                                    if (!opening) return null
                                                    return (
                                                        <button
                                                            key={p.openingId}
                                                            type="button"
                                                            onClick={() => onTrainOpening?.(opening.id)}
                                                            className="w-full rounded-xl bg-white/80 dark:bg-slate-950/40 ring-1 ring-inset ring-slate-200/80 dark:ring-slate-800 px-3 py-2 text-left hover:ring-slate-300/80 dark:hover:ring-slate-700 transition-colors"
                                                        >
                                                            <div className="flex items-center justify-between gap-3">
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                                                        {opening.name}
                                                                    </p>
                                                                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">
                                                                        {p.masteryPercent}% · next {formatDateShort(p.nextReviewDate)}
                                                                    </p>
                                                                </div>
                                                                <ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                                                            </div>
                                                        </button>
                                                    )
                                                })}
                                                {inProgress.length === 0 && (
                                                    <div className="rounded-xl bg-white/70 dark:bg-slate-950/30 ring-1 ring-inset ring-slate-200/70 dark:ring-slate-800 px-3 py-3">
                                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                            Nothing in progress
                                                        </p>
                                                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                                            Add an opening to your repertoire to start training.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-5 space-y-6">
                                <div className="rounded-2xl bg-white/70 dark:bg-slate-950/40 ring-1 ring-inset ring-slate-200/80 dark:ring-slate-800 p-5 shadow-sm">
                                    <p className="text-xs font-medium tracking-wider uppercase text-slate-500 dark:text-slate-400">
                                        Blunder Basket
                                    </p>
                                    <h3 className="mt-2 text-lg font-heading font-bold text-slate-900 dark:text-white">
                                        Mistakes worth replaying
                                    </h3>
                                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                        Tap into details, then hit “Retry now” to replay the position in the Training Arena.
                                    </p>

                                    <div className="mt-4 flex items-center justify-between gap-3">
                                        <ToneChip tone={userMistakes.length ? 'amber' : 'slate'}>
                                            {userMistakes.length} saved
                                        </ToneChip>
                                        <button
                                            type="button"
                                            onClick={() => setTab('blunderBasket')}
                                            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold bg-white text-slate-900 hover:bg-slate-50 ring-1 ring-inset ring-slate-200/80 shadow-sm transition-colors dark:bg-slate-950 dark:text-white dark:hover:bg-slate-900/60 dark:ring-slate-800"
                                        >
                                            Open Blunder Basket
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="rounded-2xl bg-white/70 dark:bg-slate-950/40 ring-1 ring-inset ring-slate-200/80 dark:ring-slate-800 p-5 shadow-sm">
                                    <p className="text-xs font-medium tracking-wider uppercase text-slate-500 dark:text-slate-400">
                                        Preferences
                                    </p>
                                    <h3 className="mt-2 text-lg font-heading font-bold text-slate-900 dark:text-white">
                                        Training feel
                                    </h3>
                                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                        Keep it minimal: theme, sound, hints, and whether lines auto-promote.
                                    </p>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <ToneChip tone="slate">
                                            <Palette className="h-3.5 w-3.5" />
                                            {preferences.theme}
                                        </ToneChip>
                                        <ToneChip tone="slate">
                                            <Volume2 className="h-3.5 w-3.5" />
                                            {preferences.soundEnabled ? 'Sound on' : 'Sound off'}
                                        </ToneChip>
                                        <ToneChip tone="slate">
                                            <BadgeCheck className="h-3.5 w-3.5" />
                                            Hints {preferences.moveHints}
                                        </ToneChip>
                                        <ToneChip tone="slate">
                                            <GraduationCap className="h-3.5 w-3.5" />
                                            Auto-promote {preferences.autoPromoteLines ? 'on' : 'off'}
                                        </ToneChip>
                                    </div>

                                    <div className="mt-4">
                                        <button
                                            type="button"
                                            onClick={() => setTab('settings')}
                                            className="inline-flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold bg-white text-slate-900 hover:bg-slate-50 ring-1 ring-inset ring-slate-200/80 shadow-sm transition-colors dark:bg-slate-950 dark:text-white dark:hover:bg-slate-900/60 dark:ring-slate-800"
                                        >
                                            <span>Open settings</span>
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {ui.activeTab === 'openings' && (
                        <div className="space-y-6">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <p className="text-xs font-medium tracking-wider uppercase text-slate-500 dark:text-slate-400">
                                        Openings
                                    </p>
                                    <h2 className="mt-2 text-2xl font-heading font-bold text-slate-900 dark:text-white">
                                        Your training list
                                    </h2>
                                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                        Each opening has a progress rollup and a one-click “Train this opening” action.
                                    </p>
                                </div>
                                <ToneChip tone="slate">
                                    {openingProgress.length} tracked
                                </ToneChip>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                {openingProgress.length === 0 && (
                                    <div className="col-span-full rounded-2xl bg-white/70 dark:bg-slate-950/40 ring-1 ring-inset ring-slate-200/80 dark:ring-slate-800 p-6 text-center">
                                        <p className="text-lg font-heading font-bold text-slate-900 dark:text-white">
                                            No openings yet
                                        </p>
                                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                            Once you start training, your mastered and in-progress openings show up here.
                                        </p>
                                    </div>
                                )}

                                {sortedOpeningProgress.map(p => {
                                    const opening = openingsById.get(p.openingId)
                                    if (!opening) return null
                                    return (
                                        <OpeningCard
                                            key={opening.id}
                                            opening={opening}
                                            progress={p}
                                            onTrain={() => onTrainOpening?.(opening.id)}
                                        />
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {ui.activeTab === 'blunderBasket' && (
                        <div className="grid gap-6 lg:grid-cols-12">
                            <div className="lg:col-span-5">
                                <div className="rounded-2xl bg-white/70 dark:bg-slate-950/40 ring-1 ring-inset ring-slate-200/80 dark:ring-slate-800 p-5 sm:p-6 shadow-sm">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-xs font-medium tracking-wider uppercase text-slate-500 dark:text-slate-400">
                                                Blunder Basket
                                            </p>
                                            <h2 className="mt-2 text-2xl font-heading font-bold text-slate-900 dark:text-white">
                                                Mistake list
                                            </h2>
                                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                                Tap a mistake to see the details, then “Retry now” to replay it.
                                            </p>
                                        </div>
                                        <ToneChip tone={userMistakes.length ? 'amber' : 'slate'}>
                                            {userMistakes.length} items
                                        </ToneChip>
                                    </div>

                                    <div className="mt-5 space-y-2">
                                        {userMistakes.length === 0 && (
                                            <div className="rounded-2xl bg-slate-50/70 dark:bg-slate-950/30 ring-1 ring-inset ring-slate-200/70 dark:ring-slate-800 p-4">
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    Nothing to fix right now
                                                </p>
                                                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                                    When you miss a move in training, it’ll land here for targeted review.
                                                </p>
                                            </div>
                                        )}

                                        {userMistakes.map(m => {
                                            const variation = variationsById.get(m.variationId) ?? null
                                            const opening = variation ? openingsById.get(variation.openingId) ?? null : null
                                            const isSelected = ui.selectedMistakeId === m.id
                                            return (
                                                <MistakeRow
                                                    key={m.id}
                                                    mistake={m}
                                                    opening={opening}
                                                    variation={variation}
                                                    selected={isSelected}
                                                    onClick={() => onViewMistake?.(m.id)}
                                                />
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-7">
                                <div className="rounded-2xl bg-white/70 dark:bg-slate-950/40 ring-1 ring-inset ring-slate-200/80 dark:ring-slate-800 p-5 sm:p-6 shadow-sm">
                                    {!selectedMistake ? (
                                        <div className="py-10 text-center">
                                            <p className="text-lg font-heading font-bold text-slate-900 dark:text-white">
                                                Select a mistake
                                            </p>
                                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                                Pick one from the list to view details and replay it.
                                            </p>
                                        </div>
                                    ) : (
                                        (() => {
                                            const variation = variationsById.get(selectedMistake.variationId) ?? null
                                            const opening = variation
                                                ? openingsById.get(variation.openingId) ?? null
                                                : null
                                            return (
                                                <div>
                                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-medium tracking-wider uppercase text-slate-500 dark:text-slate-400">
                                                                Mistake Detail
                                                            </p>
                                                            <h3 className="mt-2 text-2xl font-heading font-bold text-slate-900 dark:text-white">
                                                                {opening?.name ?? 'Unknown opening'}
                                                            </h3>
                                                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                                                {variation?.name ?? 'Unknown line'} · Occurred {formatDateShort(selectedMistake.occurredAt)}
                                                            </p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => onRetryMistake?.(selectedMistake.id)}
                                                            className="inline-flex items-center justify-center rounded-xl px-3.5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 ring-1 ring-inset ring-emerald-500/60 shadow-sm transition-colors"
                                                        >
                                                            Retry now
                                                            <ArrowUpRight className="ml-2 h-4 w-4" />
                                                        </button>
                                                    </div>

                                                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                                        <div className="rounded-2xl bg-slate-50/70 dark:bg-slate-950/30 ring-1 ring-inset ring-slate-200/70 dark:ring-slate-800 p-4">
                                                            <p className="text-xs font-medium tracking-wider uppercase text-slate-500 dark:text-slate-400">
                                                                You played
                                                            </p>
                                                            <p className="mt-2 text-lg font-heading font-bold text-amber-800 dark:text-amber-200">
                                                                {selectedMistake.wrongMove}
                                                            </p>
                                                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                                                Saved for review · {selectedMistake.reviewedCount} retries so far
                                                            </p>
                                                        </div>

                                                        <div className="rounded-2xl bg-slate-50/70 dark:bg-slate-950/30 ring-1 ring-inset ring-slate-200/70 dark:ring-slate-800 p-4">
                                                            <p className="text-xs font-medium tracking-wider uppercase text-slate-500 dark:text-slate-400">
                                                                Best move
                                                            </p>
                                                            <p className="mt-2 text-lg font-heading font-bold text-emerald-700 dark:text-emerald-200">
                                                                {selectedMistake.correctMove}
                                                            </p>
                                                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                                                Last reviewed {formatDateShort(selectedMistake.lastReviewedAt)}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="mt-5 rounded-2xl bg-white/70 dark:bg-slate-950/30 ring-1 ring-inset ring-slate-200/80 dark:ring-slate-800 p-4 sm:p-5">
                                                        <p className="text-xs font-medium tracking-wider uppercase text-slate-500 dark:text-slate-400">
                                                            Why it matters
                                                        </p>
                                                        <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                                                            {selectedMistake.explanation}
                                                        </p>
                                                        <div className="mt-4">
                                                            <p className="text-xs font-medium tracking-wider uppercase text-slate-500 dark:text-slate-400">
                                                                Position (FEN)
                                                            </p>
                                                            <div className="mt-2 rounded-xl bg-slate-950 text-slate-100 ring-1 ring-inset ring-slate-900/70 px-3 py-2 font-mono text-xs overflow-x-auto">
                                                                {selectedMistake.fen}
                                                            </div>
                                                        </div>

                                                        <div className="mt-4 flex flex-wrap gap-2">
                                                            {selectedMistake.tags.map(tag => (
                                                                <ToneChip key={tag} tone="slate">
                                                                    {tag}
                                                                </ToneChip>
                                                            ))}
                                                            {selectedMistake.tags.length === 0 && (
                                                                <ToneChip tone="slate">No tags</ToneChip>
                                                            )}
                                                        </div>

                                                        {selectedMistake.note && (
                                                            <div className="mt-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/25 ring-1 ring-inset ring-amber-200/70 dark:ring-amber-900/50 p-3">
                                                                <p className="text-xs font-medium tracking-wider uppercase text-amber-800 dark:text-amber-200">
                                                                    Note to self
                                                                </p>
                                                                <p className="mt-1 text-sm text-amber-900/90 dark:text-amber-100">
                                                                    {selectedMistake.note}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })()
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {ui.activeTab === 'settings' && (
                        <div className="grid gap-6 lg:grid-cols-12">
                            <div className="lg:col-span-4">
                                <div className="rounded-2xl bg-white/70 dark:bg-slate-950/40 ring-1 ring-inset ring-slate-200/80 dark:ring-slate-800 p-5 sm:p-6 shadow-sm">
                                    <p className="text-xs font-medium tracking-wider uppercase text-slate-500 dark:text-slate-400">
                                        Settings
                                    </p>
                                    <h2 className="mt-2 text-2xl font-heading font-bold text-slate-900 dark:text-white">
                                        Preferences
                                    </h2>
                                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                        Minimal knobs that change training feel immediately.
                                    </p>

                                    <div className="mt-4 rounded-2xl bg-slate-50/70 dark:bg-slate-950/30 ring-1 ring-inset ring-slate-200/70 dark:ring-slate-800 p-4">
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                            Theme
                                        </p>
                                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                            Choose how the app renders light/dark.
                                        </p>
                                        <div className="mt-3 inline-flex items-center rounded-xl bg-slate-100/80 dark:bg-slate-900/40 ring-1 ring-inset ring-slate-200/80 dark:ring-slate-700/60 p-1">
                                            {(['system', 'light', 'dark'] as const).map(t => {
                                                const active = preferences.theme === t
                                                return (
                                                    <button
                                                        key={t}
                                                        type="button"
                                                        onClick={() => setPrefs(updatePreferences(preferences, 'theme', t))}
                                                        className={cx(
                                                            'inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                                                            active
                                                                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 dark:bg-slate-950 dark:text-white dark:ring-slate-700'
                                                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                                                        )}
                                                    >
                                                        {t}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-8 space-y-4">
                                <SettingsToggle
                                    icon={<Volume2 className="h-4 w-4" />}
                                    label="Sound"
                                    description="Enable move sounds and feedback cues."
                                    checked={preferences.soundEnabled}
                                    onChange={(next) => setPrefs(updatePreferences(preferences, 'soundEnabled', next))}
                                />

                                <SettingsToggle
                                    icon={<BadgeCheck className="h-4 w-4" />}
                                    label="Move hints"
                                    description="Show hints during training to keep momentum when you’re stuck."
                                    checked={preferences.moveHints === 'on'}
                                    onChange={(next) => setPrefs(updatePreferences(preferences, 'moveHints', next ? 'on' : 'off'))}
                                />

                                <SettingsToggle
                                    icon={<GraduationCap className="h-4 w-4" />}
                                    label="Auto-promotion of lines"
                                    description="Automatically promote a line when you hit mastery thresholds."
                                    checked={preferences.autoPromoteLines}
                                    onChange={(next) => setPrefs(updatePreferences(preferences, 'autoPromoteLines', next))}
                                />

                                <div className="rounded-2xl bg-white/70 dark:bg-slate-950/40 ring-1 ring-inset ring-slate-200/80 dark:ring-slate-800 p-4 sm:p-5">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/70 dark:bg-emerald-950/35 dark:text-emerald-200 dark:ring-emerald-900/60">
                                            <Palette className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                Preview
                                            </p>
                                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                                Current: <span className="font-semibold text-slate-900 dark:text-white">{preferences.theme}</span>,{' '}
                                                <span className="font-semibold text-slate-900 dark:text-white">{preferences.soundEnabled ? 'sound on' : 'sound off'}</span>,{' '}
                                                <span className="font-semibold text-slate-900 dark:text-white">hints {preferences.moveHints}</span>,{' '}
                                                <span className="font-semibold text-slate-900 dark:text-white">auto-promotion {preferences.autoPromoteLines ? 'on' : 'off'}</span>.
                                            </p>
                                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                                Preferences changes trigger the single callback: <span className="font-mono text-xs">onUpdatePreferences</span>.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Keep TS happy if new tabs are added */}
                    {ui.activeTab !== 'overview' &&
                        ui.activeTab !== 'openings' &&
                        ui.activeTab !== 'blunderBasket' &&
                        ui.activeTab !== 'settings' && (
                            <div className="rounded-2xl bg-white/70 dark:bg-slate-950/40 ring-1 ring-inset ring-slate-200/80 dark:ring-slate-800 p-6 text-center">
                                <p className="text-lg font-heading font-bold text-slate-900 dark:text-white">
                                    Unknown tab
                                </p>
                                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                    This screen design expects a valid <span className="font-mono text-xs">ui.activeTab</span>.
                                </p>
                            </div>
                        )}
                </div>
            </div>
        </div>
    )
}
