import type { CurrentSession } from '../types'

interface SessionProgressProps {
    session: CurrentSession
}

export function SessionProgress({ session }: SessionProgressProps) {
    const progressPercent = session.totalMoves > 0 ? (session.movesPlayed / session.totalMoves) * 100 : 0

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Progress
                </span>
                <span className="text-sm font-mono font-semibold text-slate-900 dark:text-white">
                    {session.movesPlayed} / {session.totalMoves}
                </span>
            </div>

            <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercent}%` }}
                />
            </div>

            <div className="mt-3 flex items-center gap-1 flex-wrap">
                {Array.from({ length: session.totalMoves }, (_, i) => (
                    <div
                        key={i}
                        className={[
                            'w-2 h-2 rounded-full transition-all duration-300',
                            i < session.movesPlayed
                                ? 'bg-emerald-500 scale-100'
                                : 'bg-slate-300 dark:bg-slate-600 scale-90',
                        ].join(' ')}
                    />
                ))}
            </div>

            {session.hintsUsed > 0 && (
                <div className="mt-3 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                    <span>💡</span>
                    <span>
                        {session.hintsUsed} hint{session.hintsUsed !== 1 ? 's' : ''} used
                    </span>
                </div>
            )}
        </div>
    )
}
