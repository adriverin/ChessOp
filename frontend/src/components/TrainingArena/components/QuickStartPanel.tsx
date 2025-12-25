import { useEffect, useMemo, useState } from 'react'
import type { Opening, Side, TrainingMode, Variation, UserStats } from '../types'

export interface QuickStartPanelProps {
    openings: Opening[]
    variations: Variation[]
    userStats: UserStats
    isGuest?: boolean
    isPremium?: boolean

    selectedMode: TrainingMode
    onSelectMode?: (mode: TrainingMode) => void

    onStartSession?: (mode: TrainingMode, openingId?: string, variationId?: string) => void
    onStartFreeTrial?: () => void
    onSignUp?: () => void

    onToggleRepertoireOnly?: (enabled: boolean) => void
    onToggleWrongMoveMode?: (enabled: boolean) => void
    onChangeSideFilter?: (side: Side | null) => void
}

function safeReadBool(key: string, fallback: boolean) {
    if (typeof window === 'undefined') return fallback
    try {
        const raw = window.localStorage.getItem(key)
        if (raw === null) return fallback
        return raw === 'true'
    } catch {
        return fallback
    }
}

function safeWriteBool(key: string, value: boolean) {
    if (typeof window === 'undefined') return
    try {
        window.localStorage.setItem(key, value ? 'true' : 'false')
    } catch {
        // ignore
    }
}

function safeReadSide(key: string): Side | null {
    if (typeof window === 'undefined') return null
    try {
        const raw = window.localStorage.getItem(key)
        return raw === 'white' || raw === 'black' ? raw : null
    } catch {
        return null
    }
}

function safeWriteSide(key: string, value: Side | null) {
    if (typeof window === 'undefined') return
    try {
        if (value === null) window.localStorage.removeItem(key)
        else window.localStorage.setItem(key, value)
    } catch {
        // ignore
    }
}

function ModePill({
    mode,
    active,
    onClick,
}: {
    mode: TrainingMode
    active: boolean
    onClick?: () => void
}) {
    const label =
        mode === 'opening-training' ? 'Opening Training'
            : mode === 'one-move-drill' ? 'One Move Drill'
                : 'Opening Drill'

    return (
        <button
            onClick={onClick}
            className={[
                'inline-flex items-center justify-center rounded-full px-3 py-1.5 text-xs font-medium transition-colors ring-1 ring-inset',
                active
                    ? 'bg-emerald-600 text-white ring-emerald-500/60 shadow-sm'
                    : 'bg-white/70 dark:bg-slate-900/30 text-slate-700 dark:text-slate-200 ring-slate-200 dark:ring-slate-700 hover:bg-white dark:hover:bg-slate-900/60',
            ].join(' ')}
        >
            {label}
        </button>
    )
}

export function QuickStartPanel({
    openings,
    variations,
    userStats,
    isGuest = false,
    isPremium = false,
    selectedMode,
    onSelectMode,
    onStartSession,
    onStartFreeTrial,
    onSignUp,
    onToggleRepertoireOnly,
    onToggleWrongMoveMode,
    onChangeSideFilter,
}: QuickStartPanelProps) {
    const [repertoireOnly, setRepertoireOnly] = useState(() => safeReadBool('trainingArena.repertoireOnly', true))
    const [wrongMoveMode, setWrongMoveMode] = useState(() => safeReadBool('trainingArena.wrongMoveMode', false))
    const [side, setSide] = useState<Side | null>(() => safeReadSide('trainingArena.side'))

    useEffect(() => {
        safeWriteBool('trainingArena.repertoireOnly', repertoireOnly)
    }, [repertoireOnly])
    useEffect(() => {
        safeWriteBool('trainingArena.wrongMoveMode', wrongMoveMode)
    }, [wrongMoveMode])
    useEffect(() => {
        safeWriteSide('trainingArena.side', side)
    }, [side])

    const filteredOpenings = useMemo(() => {
        if (side === null) return openings
        return openings.filter(o => o.side === side)
    }, [openings, side])

    const [openingId, setOpeningId] = useState<string>(() => filteredOpenings[0]?.id ?? openings[0]?.id ?? '')
    const [variationId, setVariationId] = useState<string>('')

    useEffect(() => {
        // Keep a valid opening selected when filters change.
        const currentStillValid = filteredOpenings.some(o => o.id === openingId)
        if (currentStillValid) return
        setOpeningId(filteredOpenings[0]?.id ?? openings[0]?.id ?? '')
        setVariationId('')
    }, [filteredOpenings, openings, openingId])

    const filteredVariations = useMemo(() => {
        const base = variations.filter(v => v.openingId === openingId)
        const withRepertoire = repertoireOnly ? base.filter(v => v.isInRepertoire) : base
        return withRepertoire
    }, [variations, openingId, repertoireOnly])

    useEffect(() => {
        // Reset variation if it no longer exists in the filtered set.
        if (!variationId) return
        const stillValid = filteredVariations.some(v => v.id === variationId)
        if (!stillValid) setVariationId('')
    }, [filteredVariations, variationId])

    const selectedVariation = filteredVariations.find(v => v.id === variationId) ?? null

    const premiumBlocked = selectedVariation && selectedVariation.isPremium && !isPremium
    const progressionBlocked = selectedMode === 'opening-drill' && !!selectedVariation && selectedVariation.isLocked

    return (
        <section className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_10%_20%,rgba(16,185,129,0.12),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(245,158,11,0.14),transparent_45%),linear-gradient(315deg,rgba(245,158,11,0.16),transparent_55%)] dark:bg-[radial-gradient(circle_at_10%_20%,rgba(16,185,129,0.16),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(245,158,11,0.18),transparent_45%),linear-gradient(315deg,rgba(245,158,11,0.20),transparent_55%)]" />

            <header className="relative p-5 sm:p-6 border-b border-slate-200/60 dark:border-slate-800">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-base sm:text-lg font-heading font-semibold text-slate-900 dark:text-white">
                            Quick start
                        </h2>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                            Pick a mode, set filters, and jump into a session.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>🔥 {userStats.currentStreak}d</span>
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    <ModePill
                        mode="opening-training"
                        active={selectedMode === 'opening-training'}
                        onClick={() => onSelectMode?.('opening-training')}
                    />
                    <ModePill
                        mode="one-move-drill"
                        active={selectedMode === 'one-move-drill'}
                        onClick={() => onSelectMode?.('one-move-drill')}
                    />
                    <ModePill
                        mode="opening-drill"
                        active={selectedMode === 'opening-drill'}
                        onClick={() => onSelectMode?.('opening-drill')}
                    />
                </div>
            </header>

            <div className="relative p-5 sm:p-6 space-y-5">
                {/* Filters */}
                <div className="grid gap-3 sm:grid-cols-3">
                    <div className="sm:col-span-2">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Side
                        </p>
                        <div className="mt-2 grid grid-cols-3 gap-2">
                            <button
                                onClick={() => {
                                    setSide(null)
                                    onChangeSideFilter?.(null)
                                }}
                                className={[
                                    'rounded-xl px-3 py-2 text-sm font-medium ring-1 ring-inset transition-colors',
                                    side === null
                                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white ring-slate-300 dark:ring-slate-600'
                                        : 'bg-slate-50 dark:bg-slate-950/40 text-slate-600 dark:text-slate-300 ring-slate-200 dark:ring-slate-800 hover:bg-white dark:hover:bg-slate-900/30',
                                ].join(' ')}
                            >
                                Both
                            </button>
                            <button
                                onClick={() => {
                                    setSide('white')
                                    onChangeSideFilter?.('white')
                                }}
                                className={[
                                    'rounded-xl px-3 py-2 text-sm font-medium ring-1 ring-inset transition-colors',
                                    side === 'white'
                                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white ring-slate-300 dark:ring-slate-600'
                                        : 'bg-slate-50 dark:bg-slate-950/40 text-slate-600 dark:text-slate-300 ring-slate-200 dark:ring-slate-800 hover:bg-white dark:hover:bg-slate-900/30',
                                ].join(' ')}
                            >
                                ♔ White
                            </button>
                            <button
                                onClick={() => {
                                    setSide('black')
                                    onChangeSideFilter?.('black')
                                }}
                                className={[
                                    'rounded-xl px-3 py-2 text-sm font-medium ring-1 ring-inset transition-colors',
                                    side === 'black'
                                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white ring-slate-300 dark:ring-slate-600'
                                        : 'bg-slate-50 dark:bg-slate-950/40 text-slate-600 dark:text-slate-300 ring-slate-200 dark:ring-slate-800 hover:bg-white dark:hover:bg-slate-900/30',
                                ].join(' ')}
                            >
                                ♚ Black
                            </button>
                        </div>
                    </div>

                    <div className="sm:col-span-1">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Preferences
                        </p>
                        <div className="mt-2 space-y-2">
                            <label className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 px-3 py-2 ring-1 ring-inset ring-slate-200 dark:ring-slate-800">
                                <span className="text-sm text-slate-700 dark:text-slate-200">Repertoire</span>
                                <button
                                    onClick={() => {
                                        const next = !repertoireOnly
                                        setRepertoireOnly(next)
                                        onToggleRepertoireOnly?.(next)
                                    }}
                                    className={[
                                        'relative h-6 w-11 rounded-full transition-colors duration-200',
                                        repertoireOnly ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700',
                                    ].join(' ')}
                                    type="button"
                                >
                                    <span
                                        className={[
                                            'absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
                                            repertoireOnly ? 'translate-x-6' : 'translate-x-1',
                                        ].join(' ')}
                                    />
                                </button>
                            </label>

                            <label className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 px-3 py-2 ring-1 ring-inset ring-slate-200 dark:ring-slate-800">
                                <span className="text-sm text-slate-700 dark:text-slate-200">Wrong-move</span>
                                <button
                                    onClick={() => {
                                        const next = !wrongMoveMode
                                        setWrongMoveMode(next)
                                        onToggleWrongMoveMode?.(next)
                                    }}
                                    className={[
                                        'relative h-6 w-11 rounded-full transition-colors duration-200',
                                        wrongMoveMode ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700',
                                    ].join(' ')}
                                    type="button"
                                >
                                    <span
                                        className={[
                                            'absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
                                            wrongMoveMode ? 'translate-x-6' : 'translate-x-1',
                                        ].join(' ')}
                                    />
                                </button>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Opening / Variation */}
                <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Opening
                        </label>
                        <select
                            value={openingId}
                            onChange={(e) => {
                                setOpeningId(e.target.value)
                                setVariationId('')
                            }}
                            className="mt-2 w-full rounded-xl bg-white dark:bg-slate-950/40 px-3 py-2.5 text-sm text-slate-900 dark:text-white ring-1 ring-inset ring-slate-200 dark:ring-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 dark:focus:ring-emerald-500/40"
                        >
                            {filteredOpenings.length === 0 ? (
                                <option value="">No openings match</option>
                            ) : (
                                filteredOpenings.map((opening) => (
                                    <option key={opening.id} value={opening.id}>
                                        {opening.name}{opening.isPremium ? ' 🔒' : ''}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Line (optional)
                        </label>
                        <select
                            value={variationId}
                            onChange={(e) => setVariationId(e.target.value)}
                            className="mt-2 w-full rounded-xl bg-white dark:bg-slate-950/40 px-3 py-2.5 text-sm text-slate-900 dark:text-white ring-1 ring-inset ring-slate-200 dark:ring-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 dark:focus:ring-emerald-500/40"
                        >
                            <option value="">Random line</option>
                            {filteredVariations.map((variation) => (
                                <option key={variation.id} value={variation.id}>
                                    {variation.name}{variation.isPremium ? ' 🔒' : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Lock messaging */}
                {(premiumBlocked || progressionBlocked || isGuest) && (
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-4">
                        {isGuest && (
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">Guest mode</p>
                                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                        Sessions work, but progress won’t be saved.
                                    </p>
                                </div>
                                <button
                                    onClick={onSignUp}
                                    className="inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-sm font-medium text-slate-900 dark:text-white bg-white dark:bg-slate-900 ring-1 ring-inset ring-slate-200 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                    type="button"
                                >
                                    Sign up
                                </button>
                            </div>
                        )}

                        {premiumBlocked && (
                            <div className="mt-3">
                                <p className="text-sm font-medium text-slate-900 dark:text-white">🔒 This line is Premium</p>
                                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                    Start a free trial to unlock this variation.
                                </p>
                            </div>
                        )}

                        {progressionBlocked && (
                            <div className="mt-3">
                                <p className="text-sm font-medium text-slate-900 dark:text-white">🔒 Train all variations to unlock</p>
                                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                    Opening Drill unlocks after you’ve trained the full set of variations for this opening.
                                </p>
                            </div>
                        )}

                        {!isPremium && premiumBlocked && (
                            <button
                                onClick={onStartFreeTrial}
                                className="mt-3 inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm ring-1 ring-inset ring-emerald-500/60 transition-colors"
                                type="button"
                            >
                                Start free trial
                            </button>
                        )}
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                        Preferences are stored locally ({'localStorage'}) for this device.
                    </div>
                    <button
                        onClick={() => onStartSession?.(selectedMode, openingId || undefined, variationId || undefined)}
                        disabled={!openingId || premiumBlocked || progressionBlocked}
                        className={[
                            'inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ring-1 ring-inset shadow-sm',
                            !openingId || premiumBlocked || progressionBlocked
                                ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 ring-slate-200 dark:ring-slate-700 cursor-not-allowed'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white ring-emerald-500/60',
                        ].join(' ')}
                        type="button"
                    >
                        Start session
                    </button>
                </div>
            </div>
        </section>
    )
}
