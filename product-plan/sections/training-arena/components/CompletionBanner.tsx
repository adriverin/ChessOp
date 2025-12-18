import type { TrainingMode } from '../types'

interface CompletionBannerProps {
    onNextSession?: () => void
    onRetrySession?: () => void
    onSwitchMode?: (mode: TrainingMode) => void
}

const CheckCircleIcon = () => (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
)

const ArrowRightIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
)

const RefreshIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
)

const SwitchIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
)

export function CompletionBanner({
    onNextSession,
    onRetrySession,
    onSwitchMode,
}: CompletionBannerProps) {
    return (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm rounded-2xl z-10">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 max-w-md mx-4 text-center transform animate-in fade-in zoom-in-95 duration-300">
                {/* Success Icon */}
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white mb-4 shadow-lg shadow-emerald-500/30">
                    <CheckCircleIcon />
                </div>

                {/* Title */}
                <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white mb-2">
                    Line Complete!
                </h2>

                {/* Subtitle */}
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                    Great work! You've successfully completed this variation.
                </p>

                {/* XP Badge (decorative) */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full mb-6">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="font-semibold">+25 XP</span>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch gap-3">
                    <button
                        onClick={onNextSession}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-emerald-500/25"
                    >
                        <span>Next Line</span>
                        <ArrowRightIcon />
                    </button>

                    <button
                        onClick={onRetrySession}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition-colors"
                    >
                        <RefreshIcon />
                        <span>Try Again</span>
                    </button>
                </div>

                {/* Secondary Action */}
                <button
                    onClick={() => onSwitchMode?.('one-move-drill')}
                    className="mt-4 flex items-center justify-center gap-2 w-full px-4 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 font-medium text-sm transition-colors"
                >
                    <SwitchIcon />
                    <span>Switch Training Mode</span>
                </button>
            </div>
        </div>
    )
}
