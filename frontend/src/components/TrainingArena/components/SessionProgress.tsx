import type { CurrentSession } from '../types'

interface SessionProgressProps {
    session: CurrentSession
}

export function SessionProgress({ session }: SessionProgressProps) {
    const progressPercent = session.totalMoves > 0 ? (session.movesPlayed / session.totalMoves) * 100 : 0

    return (
        <div className="w-full">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span className="font-medium">Progress</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                    {session.movesPlayed}/{session.totalMoves}
                </span>
            </div>

            <div className="mt-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                    className="h-full bg-emerald-500 transition-all duration-500 ease-out"
                    style={{ width: `${progressPercent}%` }}
                />
            </div>
        </div>
    )
}
