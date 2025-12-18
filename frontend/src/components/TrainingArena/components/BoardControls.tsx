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
    const buttonBase = `
        flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
        font-medium text-sm transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-offset-2
        dark:focus:ring-offset-slate-900
    `

    const primaryButton = `
        ${buttonBase}
        bg-amber-100 hover:bg-amber-200 text-amber-800
        dark:bg-amber-900/30 dark:hover:bg-amber-900/50 dark:text-amber-300
        focus:ring-amber-400
    `

    const secondaryButton = `
        ${buttonBase}
        bg-slate-100 hover:bg-slate-200 text-slate-700
        dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300
        focus:ring-slate-400
    `

    const iconButton = `
        flex items-center justify-center w-10 h-10 rounded-xl
        bg-slate-100 hover:bg-slate-200 text-slate-600
        dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2
        dark:focus:ring-offset-slate-900
    `

    return (
        <div className="flex items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
            {/* Left: Navigation */}
            <div className="flex items-center gap-2">
                <button
                    onClick={onStepBack}
                    disabled={isComplete}
                    className={iconButton}
                    title="Step back"
                    type="button"
                >
                    <ChevronLeftIcon />
                </button>
                <button
                    onClick={onStepForward}
                    disabled={isComplete}
                    className={iconButton}
                    title="Step forward"
                    type="button"
                >
                    <ChevronRightIcon />
                </button>
            </div>

            {/* Center: Main Actions */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onRequestHint}
                    disabled={isComplete}
                    className={primaryButton}
                    type="button"
                >
                    <LightbulbIcon />
                    <span>Hint</span>
                    {hintsUsed > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 text-xs bg-amber-200 dark:bg-amber-800 rounded-full">
                            {hintsUsed}
                        </span>
                    )}
                </button>

                <button
                    onClick={onResetPosition}
                    disabled={isComplete}
                    className={secondaryButton}
                    type="button"
                >
                    <RefreshIcon />
                    <span>Reset</span>
                </button>
            </div>

            {/* Right: Spacer for balance */}
            <div className="w-[88px]" />
        </div>
    )
}

