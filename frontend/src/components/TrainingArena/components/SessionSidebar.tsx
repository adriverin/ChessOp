import type { Opening, Variation, TrainingMode, Side } from '../types'
import { useMemo, useState } from 'react'

interface SessionSidebarProps {
    openings: Opening[]
    variations: Variation[]
    currentOpeningId: string
    currentVariationId: string
    mode: TrainingMode
    filters: {
        repertoireOnly: boolean
        wrongMoveMode: boolean
        side: Side | null
    }
    movesPlayed: string[]
    onSelectOpening?: (openingId: string) => void
    onSelectVariation?: (variationId: string) => void
    onSwitchMode?: (mode: TrainingMode) => void
    onToggleRepertoireOnly?: (enabled: boolean) => void
    onToggleWrongMoveMode?: (enabled: boolean) => void
    onChangeSideFilter?: (side: Side | null) => void
}

const ChevronDownIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
)

const EyeIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
)

export function SessionSidebar({
    openings,
    variations,
    currentOpeningId,
    currentVariationId,
    filters,
    movesPlayed,
    onSelectOpening,
    onSelectVariation,
    onToggleRepertoireOnly,
    onToggleWrongMoveMode,
}: SessionSidebarProps) {
    const currentOpening = openings.find(o => o.id === currentOpeningId)
    const currentVariation = variations.find(v => v.id === currentVariationId)
    const availableVariations = variations.filter(v => v.openingId === currentOpeningId)

    const [revealAll, setRevealAll] = useState(false)

    // Parse moves for display
    const parsedMoves = useMemo(() => currentVariation?.moves.split(' ') ?? [], [currentVariation?.moves])
    const visibleMoves = revealAll ? parsedMoves : parsedMoves.slice(0, movesPlayed.length)

    return (
        <div className="flex flex-col h-full min-h-0 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Opening & Variation Selectors */}
            <div className="p-3 space-y-3 border-b border-slate-200 dark:border-slate-700">
                {/* Opening */}
                <div>
                    <label
                        htmlFor="training-arena-opening"
                        className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block"
                    >
                        Opening
                    </label>
                    <div className="relative">
                        <select
                            id="training-arena-opening"
                            value={currentOpeningId}
                            onChange={(e) => onSelectOpening?.(e.target.value)}
                            className="w-full appearance-none px-3 py-2 pr-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white font-medium cursor-pointer hover:border-slate-300 dark:hover:border-slate-500 transition-colors"
                        >
                            {openings.map(opening => (
                                <option key={opening.id} value={opening.id}>
                                    {opening.name}{opening.isPremium ? ' 🔒' : ''}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <ChevronDownIcon />
                        </div>
                    </div>
                    {currentOpening && (
                        <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                            {currentOpening.description}
                        </p>
                    )}
                </div>

                {/* Variation */}
                <div>
                    <label
                        htmlFor="training-arena-variation"
                        className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block"
                    >
                        Line
                    </label>
                    <div className="relative">
                        <select
                            id="training-arena-variation"
                            value={currentVariationId}
                            onChange={(e) => onSelectVariation?.(e.target.value)}
                            className="w-full appearance-none px-3 py-2 pr-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white font-medium cursor-pointer hover:border-slate-300 dark:hover:border-slate-500 transition-colors"
                        >
                            {availableVariations.map(variation => (
                                <option key={variation.id} value={variation.id}>
                                    {variation.name}{variation.isPremium ? ' 🔒' : ''}{variation.isLocked ? ' ⛔' : ''}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <ChevronDownIcon />
                        </div>
                    </div>
                    {currentVariation && (
                        <div className="mt-2 space-y-1">
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                                {currentVariation.description}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Move List */}
            <div className="flex-1 min-h-0 h-full px-3 py-2 overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        Move List
                    </h3>
                    <button
                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                        type="button"
                        onClick={() => setRevealAll(true)}
                    >
                        <EyeIcon />
                        Reveal All
                    </button>
                </div>

                <div className="space-y-2">
                    {visibleMoves.map((move, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50"
                        >
                            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 w-6">
                                {index + 1}.
                            </span>
                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                                {move}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Filter Toggles */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-700 space-y-3">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Filters
                </label>

                {/* Repertoire Only */}
                <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        Repertoire Only
                    </span>
                    <button
                        onClick={() => onToggleRepertoireOnly?.(!filters.repertoireOnly)}
                        role="switch"
                        aria-checked={filters.repertoireOnly}
                        aria-label="Repertoire Only"
                        className={`
                            relative w-11 h-6 rounded-full transition-colors duration-200
                            ${filters.repertoireOnly
                                ? 'bg-emerald-500'
                                : 'bg-slate-300 dark:bg-slate-600'
                            }
                        `}
                        type="button"
                    >
                        <div
                            className={`
                                absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200
                                ${filters.repertoireOnly ? 'translate-x-6' : 'translate-x-1'}
                            `}
                        />
                    </button>
                </label>

                {/* Wrong Move Mode */}
                <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        Wrong Move Mode
                    </span>
                    <button
                        onClick={() => onToggleWrongMoveMode?.(!filters.wrongMoveMode)}
                        role="switch"
                        aria-checked={filters.wrongMoveMode}
                        aria-label="Wrong Move Mode"
                        className={`
                            relative w-11 h-6 rounded-full transition-colors duration-200
                            ${filters.wrongMoveMode
                                ? 'bg-amber-500'
                                : 'bg-slate-300 dark:bg-slate-600'
                            }
                        `}
                        type="button"
                    >
                        <div
                            className={`
                                absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200
                                ${filters.wrongMoveMode ? 'translate-x-6' : 'translate-x-1'}
                            `}
                        />
                    </button>
                </label>
            </div>
        </div>
    )
}
