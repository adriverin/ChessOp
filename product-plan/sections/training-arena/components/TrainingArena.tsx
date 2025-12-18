import { useMemo, useState } from 'react'
import type { TrainingArenaProps, TrainingMode, Variation } from '../types'
import { ModePicker } from './ModePicker'
import { TrainingSession } from './TrainingSession'
import { QuickStartPanel } from './QuickStartPanel'
import { BlunderBasket } from './BlunderBasket'

function findVariation(variations: Variation[], variationId: string) {
    return variations.find(v => v.id === variationId) ?? null
}

export function TrainingArena({
    openings,
    variations,
    userProgress,
    userMistakes,
    currentSession,
    userStats,
    isGuest = false,
    isPremium = false,
    onStartSession,
    onPlayMove,
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
    onReviewMistake,
    onDismissMistake,
    onStartFreeTrial,
    onSignUp,
}: TrainingArenaProps) {
    const [selectedMode, setSelectedMode] = useState<TrainingMode>('opening-training')

    const sessionVariation = useMemo(() => {
        if (!currentSession) return null
        return findVariation(variations, currentSession.variationId)
    }, [currentSession, variations])

    const sessionNotAvailable = currentSession && userStats.staminaRemaining === 0 && !isPremium
    const sessionPremiumBlocked = currentSession && !!sessionVariation && sessionVariation.isPremium && !isPremium
    const sessionProgressionBlocked = currentSession && currentSession.mode === 'opening-drill' && !!sessionVariation && sessionVariation.isLocked

    return (
        <div className="w-full">
            {/* Decorative top band (no navigation) */}
            <div className="relative border-b border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950">
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_15%,rgba(16,185,129,0.12),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(245,158,11,0.14),transparent_40%)] dark:bg-[radial-gradient(circle_at_20%_15%,rgba(16,185,129,0.16),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(245,158,11,0.18),transparent_40%)]" />
                <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-xs font-medium tracking-wider uppercase text-slate-500 dark:text-slate-400">
                                Training Arena
                            </p>
                            <h1 className="mt-2 text-2xl sm:text-3xl font-heading font-bold text-slate-900 dark:text-white">
                                Drill openings with intent
                            </h1>
                            <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl">
                                Learn new lines, review due variations, and surface weak positions from your Blunder Basket.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                            <span className="inline-flex items-center gap-2 rounded-full bg-white/70 dark:bg-slate-900/40 px-3 py-1.5 ring-1 ring-inset ring-slate-200 dark:ring-slate-800">
                                <span>🔥</span>
                                <span className="font-medium">{userStats.currentStreak} day streak</span>
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-full bg-white/70 dark:bg-slate-900/40 px-3 py-1.5 ring-1 ring-inset ring-slate-200 dark:ring-slate-800">
                                <span>⚡</span>
                                <span className="font-medium">{userStats.staminaRemaining}/{userStats.staminaMax}</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Entry / Session */}
            {currentSession ? (
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                    {(sessionNotAvailable || sessionPremiumBlocked || sessionProgressionBlocked) && (
                        <div className="mb-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm">
                            {sessionNotAvailable && (
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">⚡ Out of stamina</p>
                                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                            Come back tomorrow. If you’re on Premium, training stays unlimited.
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={onNextSession}
                                            className="inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-sm font-medium text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 ring-1 ring-inset ring-slate-200 dark:ring-slate-700 transition-colors"
                                        >
                                            Check again
                                        </button>
                                        {!isPremium && (
                                            <button
                                                onClick={onStartFreeTrial}
                                                className="inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 ring-1 ring-inset ring-emerald-500/60 shadow-sm transition-colors"
                                            >
                                                Start free trial
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {sessionPremiumBlocked && (
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">🔒 This line is Premium</p>
                                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                            Start a free trial to unlock this variation.
                                        </p>
                                    </div>
                                    {!isPremium && (
                                        <button
                                            onClick={onStartFreeTrial}
                                            className="inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 ring-1 ring-inset ring-emerald-500/60 shadow-sm transition-colors"
                                        >
                                            Start free trial
                                        </button>
                                    )}
                                </div>
                            )}

                            {sessionProgressionBlocked && (
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">🔒 Train all variations to unlock</p>
                                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                            Opening Drill becomes available after you’ve trained the full set of variations.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => onSwitchMode?.('opening-training')}
                                        className="inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-900 dark:text-white bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/40 ring-1 ring-inset ring-amber-200/70 dark:ring-amber-700/40 transition-colors"
                                    >
                                        Switch to Opening Training
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    <TrainingSession
                        openings={openings}
                        variations={variations}
                        currentSession={currentSession}
                        userStats={userStats}
                        isGuest={isGuest}
                        onPlayMove={onPlayMove}
                        onRequestHint={onRequestHint}
                        onResetPosition={onResetPosition}
                        onStepBack={onStepBack}
                        onStepForward={onStepForward}
                        onNextSession={onNextSession}
                        onRetrySession={onRetrySession}
                        onSelectOpening={onSelectOpening}
                        onSelectVariation={onSelectVariation}
                        onSwitchMode={onSwitchMode}
                        onToggleRepertoireOnly={onToggleRepertoireOnly}
                        onToggleWrongMoveMode={onToggleWrongMoveMode}
                        onChangeSideFilter={onChangeSideFilter}
                    />
                </div>
            ) : (
                <div className="bg-slate-50 dark:bg-slate-950">
                    <ModePicker
                        userStats={userStats}
                        userProgress={userProgress}
                        variations={variations}
                        isGuest={isGuest}
                        isPremium={isPremium}
                        onSelectMode={(mode) => {
                            setSelectedMode(mode)
                            onSwitchMode?.(mode)
                        }}
                        onStartFreeTrial={onStartFreeTrial}
                        onSignUp={onSignUp}
                    />

                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 sm:pb-14">
                        <div className="grid gap-6 lg:grid-cols-12">
                            <div className="lg:col-span-7">
                                <QuickStartPanel
                                    openings={openings}
                                    variations={variations}
                                    userStats={userStats}
                                    isGuest={isGuest}
                                    isPremium={isPremium}
                                    selectedMode={selectedMode}
                                    onSelectMode={(mode) => {
                                        setSelectedMode(mode)
                                        onSwitchMode?.(mode)
                                    }}
                                    onStartSession={onStartSession}
                                    onStartFreeTrial={onStartFreeTrial}
                                    onSignUp={onSignUp}
                                    onToggleRepertoireOnly={onToggleRepertoireOnly}
                                    onToggleWrongMoveMode={onToggleWrongMoveMode}
                                    onChangeSideFilter={onChangeSideFilter}
                                />
                            </div>
                            <div className="lg:col-span-5">
                                <BlunderBasket
                                    userMistakes={userMistakes}
                                    variations={variations}
                                    onReviewMistake={onReviewMistake}
                                    onDismissMistake={onDismissMistake}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
