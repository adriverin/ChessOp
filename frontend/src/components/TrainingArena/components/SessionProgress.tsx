interface SessionProgressProps {
    movesPlayed: number
    totalMoves: number
    hintsUsed: number
}

export function SessionProgress({ movesPlayed, totalMoves, hintsUsed }: SessionProgressProps) {
    const progressPercent = totalMoves > 0 ? (movesPlayed / totalMoves) * 100 : 0

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                    Progress
                </span>
                <span className="text-slate-600 dark:text-slate-400">
                    {movesPlayed}/{totalMoves} moves
                </span>
            </div>

            <div className="relative h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                    className="absolute left-0 top-0 h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                />
            </div>

            {hintsUsed > 0 && (
                <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                    <span>💡</span>
                    <span>{hintsUsed} hint{hintsUsed !== 1 ? 's' : ''} used</span>
                </div>
            )}
        </div>
    )
}

