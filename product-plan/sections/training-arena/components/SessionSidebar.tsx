import type { Opening, Variation, TrainingMode, Side } from '../types'

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

const modeLabels: Record<TrainingMode, string> = {
    'opening-training': 'Opening Training',
    'one-move-drill': 'One Move Drill',
    'opening-drill': 'Opening Drill',
}

export function SessionSidebar({
    openings,
    variations,
    currentOpeningId,
    currentVariationId,
    mode,
    filters,
    movesPlayed,
    onSelectOpening,
    onSelectVariation,
    onSwitchMode,
    onToggleRepertoireOnly,
    onToggleWrongMoveMode,
    onChangeSideFilter,
}: SessionSidebarProps) {
    const currentOpening = openings.find(o => o.id === currentOpeningId)
    const currentVariation = variations.find(v => v.id === currentVariationId)
    const availableVariations = variations.filter(v => v.openingId === currentOpeningId)

    // Parse moves for display
    const parsedMoves = currentVariation?.moves.split(' ') || []

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Mode Selector */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                    Training Mode
                </label>
                <div className="relative">
                    <select
                        value={mode}
                        onChange={(e) => onSwitchMode?.(e.target.value as TrainingMode)}
                        className="w-full appearance-none px-4 py-2.5 pr-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white font-medium cursor-pointer hover:border-slate-300 dark:hover:border-slate-500 transition-colors"
                    >
                        <option value="opening-training">{modeLabels['opening-training']}</option>
                        <option value="one-move-drill">{modeLabels['one-move-drill']}</option>
                        <option value="opening-drill">{modeLabels['opening-drill']}</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronDownIcon />
                    </div>
                </div>
            </div>

            {/* Opening & Variation Selectors */}
            <div className="p-4 space-y-4 border-b border-slate-200 dark:border-slate-700">
                {/* Opening */}
                <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                        Opening
                    </label>
                    <div className="relative">
	                        <select
	                            value={currentOpeningId}
	                            onChange={(e) => onSelectOpening?.(e.target.value)}
	                            className="w-full appearance-none px-4 py-2.5 pr-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white font-medium cursor-pointer hover:border-slate-300 dark:hover:border-slate-500 transition-colors"
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
                        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                            ECO: {currentOpening.eco} • {currentOpening.side === 'white' ? '♔ White' : '♚ Black'}
                        </p>
                    )}
                </div>

                {/* Variation */}
                <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                        Variation
                    </label>
                    <div className="relative">
	                        <select
	                            value={currentVariationId}
	                            onChange={(e) => onSelectVariation?.(e.target.value)}
	                            className="w-full appearance-none px-4 py-2.5 pr-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white font-medium cursor-pointer hover:border-slate-300 dark:hover:border-slate-500 transition-colors"
	                        >
	                            {availableVariations.map(variation => (
	                                <option key={variation.id} value={variation.id}>
	                                    {variation.name}{variation.isPremium ? ' 🔒' : ''}{variation.isLocked ? ' ⛓' : ''}
	                                </option>
	                            ))}
	                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <ChevronDownIcon />
                        </div>
                    </div>
                </div>
            </div>

            {/* Move Log */}
            <div className="flex-1 p-4 overflow-auto">
                <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Move Log
                    </label>
                    <button className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium">
                        <EyeIcon />
                        <span>Reveal All</span>
                    </button>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 font-mono text-sm">
                    {parsedMoves.length === 0 ? (
                        <p className="text-slate-400 dark:text-slate-500 italic">No moves yet</p>
                    ) : (
                        <div className="space-y-1">
                            {parsedMoves.map((move, index) => {
                                const isPlayed = index < movesPlayed.length * 2 // Rough approximation
                                return (
                                    <span
                                        key={index}
                                        className={`inline-block mr-2 ${isPlayed
                                                ? 'text-slate-900 dark:text-white'
                                                : 'text-slate-300 dark:text-slate-600'
                                            }`}
                                    >
                                        {move}
                                    </span>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Filter Toggles */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
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
                        className={`
                            relative w-11 h-6 rounded-full transition-colors duration-200
                            ${filters.repertoireOnly
                                ? 'bg-emerald-500'
                                : 'bg-slate-300 dark:bg-slate-600'
                            }
                        `}
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
                        className={`
                            relative w-11 h-6 rounded-full transition-colors duration-200
                            ${filters.wrongMoveMode
                                ? 'bg-amber-500'
                                : 'bg-slate-300 dark:bg-slate-600'
                            }
                        `}
                    >
                        <div
                            className={`
                                absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200
                                ${filters.wrongMoveMode ? 'translate-x-6' : 'translate-x-1'}
                            `}
                        />
                    </button>
                </label>

                {/* Side Filter */}
                <div className="flex items-center gap-2 pt-2">
                    <button
                        onClick={() => onChangeSideFilter?.(null)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filters.side === null
                                ? 'bg-slate-200 dark:bg-slate-600 text-slate-900 dark:text-white'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        Both
                    </button>
                    <button
                        onClick={() => onChangeSideFilter?.('white')}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filters.side === 'white'
                                ? 'bg-slate-200 dark:bg-slate-600 text-slate-900 dark:text-white'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        ♔ White
                    </button>
                    <button
                        onClick={() => onChangeSideFilter?.('black')}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filters.side === 'black'
                                ? 'bg-slate-200 dark:bg-slate-600 text-slate-900 dark:text-white'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        ♚ Black
                    </button>
                </div>
            </div>
        </div>
    )
}
