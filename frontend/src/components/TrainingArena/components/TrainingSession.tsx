import type { Opening, Variation, CurrentSession, UserStats, TrainingMode, Side } from '../types'
import { SessionProgress } from './SessionProgress'
import { BoardControls } from './BoardControls'
import { SessionSidebar } from './SessionSidebar'
import { CompletionBanner } from './CompletionBanner'
import { cloneElement, isValidElement, type ReactNode } from 'react'

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
    /** Optional injected board UI (e.g., real board). */
    board?: ReactNode
    /** For guest banner call-to-action. */
    onSignUp?: () => void

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

    /** Overlay to show on success (e.g. SuccessOverlay) */
    successOverlay?: ReactNode
}

function ChessboardPlaceholder({ isWhitePerspective }: { isWhitePerspective: boolean }) {
    const files = isWhitePerspective ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']
    const ranks = isWhitePerspective ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8]

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

function GuestBanner({ onSignUp }: { onSignUp?: () => void }) {
    return (
        <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border border-amber-200 dark:border-amber-700/50">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-200 dark:bg-amber-800/50 flex items-center justify-center">
                    <span className="text-lg">👋</span>
                </div>
                <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                        Guest Mode
                    </p>
                    <p className="text-xs text-amber-800 dark:text-amber-200">
                        Your progress won't be saved.{' '}
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
    ...props
}: TrainingSessionProps) {
    const {
        openings,
        variations,
        currentSession,
        isGuest = false,
        board,
        onSignUp,
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
        successOverlay,
    } = props
    const currentOpening = openings.find(o => o.id === currentSession.openingId)
    const currentVariation = variations.find(v => v.id === currentSession.variationId)
    const isWhitePerspective = currentOpening?.side === 'white'

    const movesPlayed = Array(currentSession.movesPlayed).fill('')
    const boardElement = (() => {
        if (!board) return null
        if (!isValidElement<any>(board)) return board
        if (typeof board.type === 'string') return board
        return cloneElement(board, { fitToViewport: true } as any)
    })()

    return (
        <div className="w-full max-w-7xl mx-auto px-4 pt-0 pb-4 sm:px-6 lg:px-8 flex flex-col lg:h-[calc(100vh-80px)] lg:min-h-0">
            {isGuest && <GuestBanner onSignUp={onSignUp} />}

            <div className="mb-1 flex-none">
                <h1 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 dark:text-white">
                    {currentVariation?.name || 'Training Session'}
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                    {currentOpening?.name} • {currentVariation?.description}
                </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 items-stretch">
                <div className={`flex-1 min-w-0 min-h-0 flex flex-col ${currentSession.mode === 'one-move-drill' ? 'col-span-full' : ''}`}>
                    <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex-1 min-h-0 flex flex-col">
                        {currentSession.isComplete && (
                            <CompletionBanner
                                onNextSession={onNextSession}
                                onRetrySession={onRetrySession}
                                onSwitchMode={onSwitchMode}
                            />
                        )}

                        <div className="flex-none mb-2">
                            <SessionProgress session={currentSession} />
                        </div>

                        <div className="flex-1 min-h-0 relative flex items-center justify-center">
                            {boardElement ?? <ChessboardPlaceholder isWhitePerspective={isWhitePerspective ?? true} />}
                            {successOverlay}
                        </div>

                        {currentSession.mode !== 'one-move-drill' && (
                            <div className="flex-none pb-2 pt-2">
                                <BoardControls
                                    hintsUsed={currentSession.hintsUsed}
                                    isComplete={currentSession.isComplete}
                                    onRequestHint={onRequestHint}
                                    onResetPosition={onResetPosition}
                                    onStepBack={onStepBack}
                                    onStepForward={onStepForward}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {currentSession.mode !== 'one-move-drill' && (
                    <div className="w-full lg:w-80 lg:h-full lg:overflow-hidden lg:min-h-0">
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
                )}
            </div>
        </div>
    )
}
