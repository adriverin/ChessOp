import type { UserMistake, Variation } from '../types'

export interface BlunderBasketProps {
    userMistakes: UserMistake[]
    variations: Variation[]
    onReviewMistake?: (mistakeId: string) => void
    onDismissMistake?: (mistakeId: string) => void
}

function formatWhen(iso: string) {
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return 'Recently'
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function FenPill({ fen }: { fen: string }) {
    const compact = fen.split(' ').slice(0, 4).join(' ')
    return (
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 dark:bg-slate-900 px-3 py-1 text-xs text-slate-600 dark:text-slate-300 ring-1 ring-inset ring-slate-200 dark:ring-slate-700">
            <span className="font-mono">{compact}</span>
        </div>
    )
}

export function BlunderBasket({
    userMistakes,
    variations,
    onReviewMistake,
    onDismissMistake,
}: BlunderBasketProps) {
    const mistakes = userMistakes.slice().sort((a, b) => {
        const aTime = new Date(a.occurredAt).getTime()
        const bTime = new Date(b.occurredAt).getTime()
        return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime)
    })

    return (
        <section className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_15%_15%,rgba(245,158,11,0.14),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(16,185,129,0.12),transparent_40%)] dark:bg-[radial-gradient(circle_at_15%_15%,rgba(245,158,11,0.18),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(16,185,129,0.16),transparent_40%)]" />

            <header className="relative flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-slate-200/60 dark:border-slate-800">
                <div>
                    <div className="inline-flex items-center gap-2">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 ring-1 ring-inset ring-amber-200/60 dark:ring-amber-700/40">
                            <span className="text-lg leading-none">♟</span>
                        </span>
                        <h2 className="text-base sm:text-lg font-heading font-semibold text-slate-900 dark:text-white">
                            Blunder Basket
                        </h2>
                    </div>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                        Review positions where you played the wrong move — perfect for “blunder injection”.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 ring-1 ring-inset ring-slate-200 dark:ring-slate-700">
                        {mistakes.length} saved
                    </span>
                </div>
            </header>

            <div className="relative p-5 sm:p-6">
                {mistakes.length === 0 ? (
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center">
                        <p className="font-medium text-slate-900 dark:text-white">No mistakes saved</p>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                            When you miss a move during training, it will land here for targeted review.
                        </p>
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {mistakes.slice(0, 4).map((mistake) => {
                            const variation = variations.find(v => v.id === mistake.variationId)
                            return (
                                <li
                                    key={mistake.id}
                                    className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/30 p-4 sm:p-5 shadow-[0_1px_0_rgba(15,23,42,0.04)]"
                                >
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                                    {variation?.name ?? 'Unknown variation'}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                    {formatWhen(mistake.occurredAt)} • Played <span className="font-mono">{mistake.wrongMove}</span>, best was <span className="font-mono">{mistake.correctMove}</span>
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <button
                                                    onClick={() => onDismissMistake?.(mistake.id)}
                                                    className="inline-flex items-center rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100/70 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 ring-1 ring-inset ring-slate-200 dark:ring-slate-700 transition-colors"
                                                    type="button"
                                                >
                                                    Dismiss
                                                </button>
                                                <button
                                                    onClick={() => onReviewMistake?.(mistake.id)}
                                                    className="inline-flex items-center rounded-lg px-3 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 ring-1 ring-inset ring-emerald-500/50 shadow-sm transition-colors"
                                                    type="button"
                                                >
                                                    Review
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                            <FenPill fen={mistake.fen} />
                                            {mistake.reviewedCount > 0 && (
                                                <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200 px-2.5 py-1 text-xs font-medium ring-1 ring-inset ring-emerald-200/70 dark:ring-emerald-700/40">
                                                    Reviewed {mistake.reviewedCount}×
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                                            <span className="text-slate-500 dark:text-slate-400">Why:</span> {mistake.explanation}
                                        </p>
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                )}

                {mistakes.length > 4 && (
                    <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                        Showing 4 of {mistakes.length} — review and dismiss to keep this list focused.
                    </p>
                )}
            </div>
        </section>
    )
}

