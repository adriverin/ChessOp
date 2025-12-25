import { useMemo, type ReactNode } from 'react'
import {
    ArrowUpRight,
    CheckCircle2,
    ChevronRight,
    Flame,
    GraduationCap,
    Settings,
} from 'lucide-react'
import type {
    Opening,
    OpeningProgress,
    PlayerProfileProps,
    PlayerProfileTab,
} from '../types'
import { BlunderBasket } from '../../TrainingArena/components/BlunderBasket'
import { SettingsPanel } from './SettingsPanel'

export interface ExtendedPlayerProfileProps extends PlayerProfileProps {
    onClearAllMistakes?: () => void
}

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
    icon: ReactNode
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



export function PlayerProfile({
    user,
    openings,
    variations,
    openingProgress,
    userMistakes,
    ui,
    preferences,
    isGuest = false,
    isPremium = false,
    onSelectTab,
    onTrainOpening,
    onRetryMistake,
    onDismissMistake,
    onUpdatePreferences,
    onClearAllMistakes,
}: ExtendedPlayerProfileProps) {
    const openingsById = useMemo(() => new Map(openings.map(o => [o.id, o])), [openings])


    const sortedOpeningProgress = useMemo(
        () => sortOpeningProgress(openingProgress),
        [openingProgress]
    )

    const favorites = useMemo(
        () => openingProgress.filter(p => p.isInRepertoire),
        [openingProgress]
    )

    const mastered = useMemo(
        () => openingProgress.filter(p => p.status === 'mastered'),
        [openingProgress]
    )
    const inProgress = useMemo(
        () => openingProgress.filter(p => p.status === 'inProgress'),
        [openingProgress]
    )


    const primaryFocus = useMemo(() => {
        if (inProgress.length > 0) return 'In progress'
        if (mastered.length > 0) return 'Mastered'
        return 'Getting started'
    }, [inProgress.length, mastered.length])


    const tabs: Array<{ id: PlayerProfileTab; label: string; icon: ReactNode }> = [
        { id: 'overview', label: 'Overview', icon: <GraduationCap className="h-4 w-4" /> },
        { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
    ]

    const setTab = (tab: PlayerProfileTab) => onSelectTab?.(tab)


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
                                <div className="h-[500px] rounded-2xl bg-white/70 dark:bg-slate-950/40 ring-1 ring-inset ring-slate-200/80 dark:ring-slate-800 p-5 sm:p-6 shadow-sm">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <p className="text-xs font-medium tracking-wider uppercase text-slate-500 dark:text-slate-400">
                                                My Repertoire
                                            </p>
                                            <h2 className="mt-2 text-xl font-heading font-bold text-slate-900 dark:text-white">
                                                Your Favorites
                                            </h2>
                                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                                Openings you have starred for quick access.
                                            </p>
                                        </div>
                                        <ToneChip tone="emerald">
                                            <GraduationCap className="h-3.5 w-3.5" />
                                            {favorites.filter(p => p.status === 'mastered').length}/{favorites.length} mastered
                                        </ToneChip>
                                    </div>

                                    <div className="mt-5">
                                        {openingProgress.filter(p => p.isInRepertoire).length === 0 ? (
                                            <div className="rounded-xl bg-slate-50 dark:bg-slate-950/30 ring-1 ring-inset ring-slate-200/70 dark:ring-slate-800 px-4 py-8 text-center">
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    No favorites yet
                                                </p>
                                                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                                    Go to the Curriculum to star your favorite openings.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                                                {openingProgress.filter(p => p.isInRepertoire).map(p => {
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
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                                                            {opening.name}
                                                                        </p>
                                                                        <ToneChip tone={statusTone(p.status)}>
                                                                            {statusLabel(p.status)}
                                                                        </ToneChip>
                                                                    </div>

                                                                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">
                                                                        {p.masteryPercent}% · {p.masteredVariations}/{p.totalVariations} vars
                                                                    </p>
                                                                </div>
                                                                <ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                                                            </div>
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-5 space-y-4">
                                <div className="h-[500px]">
                                    <BlunderBasket
                                        userMistakes={userMistakes}
                                        variations={variations}
                                        onReviewMistake={onRetryMistake}
                                        onDismissMistake={onDismissMistake}
                                        onClearAll={onClearAllMistakes}
                                    />
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

                    {ui.activeTab === 'settings' && (
                        <SettingsPanel preferences={preferences} onUpdate={onUpdatePreferences || (() => { })} />
                    )}



                </div>
            </div>
        </div>
    )
}
