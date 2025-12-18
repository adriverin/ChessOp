import type { Opening, Variation, CurrentSession, UserStats, TrainingMode, Side } from '../types'
import { SessionProgress } from './SessionProgress'
import { BoardControls } from './BoardControls'
import { SessionSidebar } from './SessionSidebar'
import { CompletionBanner } from './CompletionBanner'

export interface TrainingSessionProps {
    /** List of available openings */
    openings: Opening[]
    /** List of variations across all openings */
    variations: Variation[]
    /** Current active training session */
    currentSession: CurrentSession
    /** User's overall stats */
    userStats: UserStats
    /** Whether the user is a guest */
    isGuest?: boolean

    // === Session Actions ===
    onPlayMove?: (move: string) => void
    onRequestHint?: () => void
    onResetPosition?: () => void
    onStepBack?: () => void
    onStepForward?: () => void
    onNextSession?: () => void
    onRetrySession?: () => void

    // === Navigation Actions ===
    onSelectOpening?: (openingId: string) => void
    onSelectVariation?: (variationId: string) => void
    onSwitchMode?: (mode: TrainingMode) => void

    // === Preference Actions ===
    onToggleRepertoireOnly?: (enabled: boolean) => void
    onToggleWrongMoveMode?: (enabled: boolean) => void
    onChangeSideFilter?: (side: Side | null) => void
}

// Chessboard placeholder - stylized representation
function ChessboardPlaceholder({ isWhitePerspective }: { isWhitePerspective: boolean }) {
    const files = isWhitePerspective ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']
    const ranks = isWhitePerspective ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8]

    // Initial piece positions
    const pieces: Record<string, string> = {
        'a8': '♜', 'b8': '♞', 'c8': '♝', 'd8': '♛', 'e8': '♚', 'f8': '♝', 'g8': '♞', 'h8': '♜',
        'a7': '♟', 'b7': '♟', 'c7': '♟', 'd7': '♟', 'e7': '♟', 'f7': '♟', 'g7': '♟', 'h7': '♟',
        'a2': '♙', 'b2': '♙', 'c2': '♙', 'd2': '♙', 'e2': '♙', 'f2': '♙', 'g2': '♙', 'h2': '♙',
        'a1': '♖', 'b1': '♘', 'c1': '♗', 'd1': '♕', 'e1': '♔', 'f1': '♗', 'g1': '♘', 'h1': '♖',
    }

    return (
        <div className="aspect-square w-full max-w-[560px] mx-auto">
            <div className="grid grid-cols-8 gap-0 w-full h-full rounded-xl overflow-hidden shadow-xl ring-1 ring-slate-900/10 dark:ring-white/10">
                {ranks.map((rank, rankIndex) =>
                    files.map((file, fileIndex) => {
                        const isLight = (rankIndex + fileIndex) % 2 === 0
                        const square = `${file}${rank}`
                        const piece = pieces[square]

                        return (
                            <div
                                key={square}
                                className={`
                                    aspect-square flex items-center justify-center text-3xl sm:text-4xl md:text-5xl
                                    transition-colors cursor-pointer
                                    ${isLight
                                        ? 'bg-amber-100 hover:bg-amber-200 dark:bg-amber-200/90 dark:hover:bg-amber-300'
                                        : 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800'
                                    }
                                `}
                            >
                                {piece && (
                                    <span className={`
                                        select-none drop-shadow-sm
                                        ${piece.charCodeAt(0) >= 9812 && piece.charCodeAt(0) <= 9817
                                            ? 'text-white'
                                            : 'text-slate-900'
                                        }
                                    `}>
                                        {piece}
                                    </span>
                                )}
                            </div>
                        )
                    })
                )}
            </div>
            {/* File labels */}
            <div className="grid grid-cols-8 mt-1">
                {files.map(file => (
                    <div key={file} className="text-center text-xs font-mono text-slate-500 dark:text-slate-400">
                        {file}
                    </div>
                ))}
            </div>
        </div>
    )
}

// Guest mode banner
function GuestBanner({ onSignUp }: { onSignUp?: () => void }) {
    return (
        <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border border-amber-200 dark:border-amber-700/50">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-400 dark:bg-amber-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-amber-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                        Training as guest — progress won't be saved.{' '}
                        <button onClick={onSignUp} className="underline hover:no-underline">
                            Sign up
                        </button>
                    </p>
                </div>
            </div>
        </div>
    )
}

export function TrainingSession({
    openings,
    variations,
    currentSession,
    userStats,
    isGuest = false,
    onRequestHint,
    onResetPosition,
    onStepBack,
    onStepForward,
    onNextSession,
    onRetrySession,
    onSelectOpening,
    onSelectVariation,
    onSwitchMode,
    onToggleRepertoireOnly,
    onToggleWrongMoveMode,
    onChangeSideFilter,
}: TrainingSessionProps) {
    const currentOpening = openings.find(o => o.id === currentSession.openingId)
    const currentVariation = variations.find(v => v.id === currentSession.variationId)
    const isWhitePerspective = currentOpening?.side === 'white'

    // Mock moves played for the move log
    const movesPlayed = Array(currentSession.movesPlayed).fill('')

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            {/* Guest Banner */}
            {isGuest && <GuestBanner />}

            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <span className={`
                        px-2.5 py-1 text-xs font-semibold rounded-full
                        ${currentSession.mode === 'opening-training'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : currentSession.mode === 'one-move-drill'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                        }
                    `}>
                        {currentSession.mode === 'opening-training' ? 'Opening Training' :
                            currentSession.mode === 'one-move-drill' ? 'One Move Drill' : 'Opening Drill'}
                    </span>
                    {currentVariation && (
                        <span className={`
                            px-2 py-0.5 text-xs font-medium rounded
                            ${currentVariation.difficulty === 'beginner'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : currentVariation.difficulty === 'intermediate'
                                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }
                        `}>
                            {currentVariation.difficulty}
                        </span>
                    )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 dark:text-white">
                    {currentVariation?.name || 'Training Session'}
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                    {currentOpening?.name} • {currentVariation?.description}
                </p>
            </div>

            {/* Main Layout */}
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Board Area */}
                <div className="flex-1 min-w-0">
                    <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                        {/* Completion overlay */}
                        {currentSession.isComplete && (
                            <CompletionBanner
                                onNextSession={onNextSession}
                                onRetrySession={onRetrySession}
                                onSwitchMode={onSwitchMode}
                            />
                        )}

                        {/* Status message */}
                        <div className="mb-4 flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                {currentSession.isComplete
                                    ? '✨ Line complete!'
                                    : `Your turn — play ${isWhitePerspective ? 'White' : 'Black'}'s move`
                                }
                            </p>
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                <span>🔥 {userStats.currentStreak} day streak</span>
                                <span>•</span>
                                <span>⚡ {userStats.staminaRemaining}/{userStats.staminaMax}</span>
                            </div>
                        </div>

                        {/* Chessboard */}
                        <ChessboardPlaceholder isWhitePerspective={isWhitePerspective} />

                        {/* Progress */}
                        <div className="mt-6">
                            <SessionProgress session={currentSession} />
                        </div>

                        {/* Controls */}
                        <div className="mt-4">
                            <BoardControls
                                hintsUsed={currentSession.hintsUsed}
                                isComplete={currentSession.isComplete}
                                onRequestHint={onRequestHint}
                                onResetPosition={onResetPosition}
                                onStepBack={onStepBack}
                                onStepForward={onStepForward}
                            />
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
                    <SessionSidebar
                        openings={openings}
                        variations={variations}
                        currentOpeningId={currentSession.openingId}
                        currentVariationId={currentSession.variationId}
                        mode={currentSession.mode}
                        filters={currentSession.filters}
                        movesPlayed={movesPlayed}
                        onSelectOpening={onSelectOpening}
                        onSelectVariation={onSelectVariation}
                        onSwitchMode={onSwitchMode}
                        onToggleRepertoireOnly={onToggleRepertoireOnly}
                        onToggleWrongMoveMode={onToggleWrongMoveMode}
                        onChangeSideFilter={onChangeSideFilter}
                    />
                </div>
            </div>
        </div>
    )
}
