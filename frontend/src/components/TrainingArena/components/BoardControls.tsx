interface BoardControlsProps {
    hintsUsed: number
    isComplete: boolean
    onRequestHint?: () => void
    onResetPosition?: () => void
    onStepBack?: () => void
    onStepForward?: () => void
}

// Icon components
const LightbulbIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
)

const RefreshIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
)

const ChevronLeftIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
)

const ChevronRightIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
)

export function BoardControls({
    hintsUsed,
    isComplete,
    onRequestHint,
    onResetPosition,
    onStepBack,
    onStepForward,
}: BoardControlsProps) {
    const iconButton = `
        relative inline-flex items-center justify-center w-9 h-9 rounded-lg
        bg-slate-100 hover:bg-slate-200 text-slate-700
        dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200
        transition-all duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2
        dark:focus:ring-offset-slate-900
    `

    const hintButton = `
        ${iconButton}
        bg-amber-100 hover:bg-amber-200 text-amber-900
        dark:bg-amber-900/30 dark:hover:bg-amber-900/45 dark:text-amber-200
        focus:ring-amber-400
    `

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={onStepBack}
                disabled={isComplete}
                className={iconButton}
                aria-label="Step back"
                title="Step back"
                type="button"
            >
                <ChevronLeftIcon />
            </button>
            <button
                onClick={onStepForward}
                disabled={isComplete}
                className={iconButton}
                aria-label="Step forward"
                title="Step forward"
                type="button"
            >
                <ChevronRightIcon />
            </button>

            <button
                onClick={onRequestHint}
                disabled={isComplete}
                className={hintButton}
                aria-label="Hint"
                title="Hint"
                type="button"
            >
                <LightbulbIcon />
                {hintsUsed > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-amber-500 text-white text-[10px] leading-4 text-center ring-2 ring-white dark:ring-slate-900">
                        {hintsUsed}
                    </span>
                )}
            </button>

            <button
                onClick={onResetPosition}
                disabled={isComplete}
                className={iconButton}
                aria-label="Reset"
                title="Reset"
                type="button"
            >
                <RefreshIcon />
            </button>
        </div>
    )
}
