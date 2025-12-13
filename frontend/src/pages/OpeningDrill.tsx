import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api/client';
import type { OpeningDrillOpening, OpeningDrillStats, OpeningDrillBadge } from '../api/client';
import type { OpeningDrillResponse } from '../types';
import { GameArea } from '../components/GameArea';
import { useUser } from '../context/UserContext';
import { Trophy, ArrowRight, XCircle, Lock, Target, Star, Medal, ChevronDown, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';

export const OpeningDrill: React.FC = () => {
    const { user, refreshUser } = useUser();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    // State for Openings List
    const [availableOpenings, setAvailableOpenings] = useState<OpeningDrillOpening[]>([]);
    const [openingsLoading, setOpeningsLoading] = useState(true);
    const [selectedOpeningId, setSelectedOpeningId] = useState<string | null>(searchParams.get('opening_id'));

    // State for Drill Session
    const [session, setSession] = useState<OpeningDrillResponse | null>(null);
    const [sessionLoading, setSessionLoading] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [failed, setFailed] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [stats, setStats] = useState<OpeningDrillStats | null>(null);
    const [badges, setBadges] = useState<OpeningDrillBadge[]>([]);
    const [showStats, setShowStats] = useState(true);

    const handlePremiumError = useCallback((err: any) => {
        if (err?.response?.status === 403 && err?.response?.data?.error === 'PREMIUM_REQUIRED') {
            if (user?.is_authenticated) {
                navigate('/pricing');
            } else {
                navigate('/login', { state: { from: { pathname: '/pricing' } } });
            }
            return true;
        }
        return false;
    }, [navigate, user]);

    // Fetch Available Openings on Mount
    useEffect(() => {
        if (!user?.is_authenticated) return;
        
        setOpeningsLoading(true);
        api.getOpeningDrillOpenings()
            .then(data => {
                setAvailableOpenings(data.openings);
                
                // If ID is in URL, validate it
                const urlId = searchParams.get('opening_id');
                if (urlId) {
                    const exists = data.openings.find(o => o.slug === urlId);
                    if (exists) {
                        setSelectedOpeningId(urlId);
                    } else {
                        // Invalid ID in URL
                        setSearchParams({});
                        setSelectedOpeningId(null);
                    }
                }
            })
            .catch(err => {
                if (!handlePremiumError(err)) {
                    console.error(err);
                }
            })
            .finally(() => setOpeningsLoading(false));
    }, [user, searchParams, setSearchParams, handlePremiumError]);

    const fetchStats = useCallback(async (openingId: string) => {
        try {
            const data = await api.getOpeningDrillStats(openingId);
            setStats(data.stats);
            setBadges(data.badges);
        } catch (err) {
            if (!handlePremiumError(err)) {
                console.error('Failed to fetch stats', err);
            }
        }
    }, [handlePremiumError]);

    const fetchSession = useCallback(async () => {
        if (!selectedOpeningId) return;
        
        setSessionLoading(true);
        setCompleted(false);
        setFailed(false);
        setMessage(null);
        try {
            const data = await api.getOpeningDrillSession(selectedOpeningId);
            setSession(data);
        } catch (err: any) {
            if (handlePremiumError(err)) {
                return;
            }
            console.error("Failed to fetch drill session", err);
            if (err.response?.status === 403) {
                setMessage("This opening is not unlocked for drilling yet. You must successfully train all variations first.");
            } else if (err.response?.status === 404) {
                setMessage("Opening or variations not found.");
            } else {
                setMessage("Failed to load drill session. Please try again.");
            }
            setSession(null);
        } finally {
            setSessionLoading(false);
        }
    }, [selectedOpeningId, handlePremiumError]);

    // Trigger session fetch when selection changes
    useEffect(() => {
        if (selectedOpeningId) {
            fetchStats(selectedOpeningId);
            fetchSession();
        } else {
            setSession(null);
            setStats(null);
            setBadges([]);
        }
    }, [selectedOpeningId, fetchSession, fetchStats]);

    const handleSelectOpening = (slug: string) => {
        setSelectedOpeningId(slug);
        setSearchParams({ opening_id: slug });
    };

    const handleComplete = async (_success: boolean, hintUsed: boolean) => {
        if (!session || failed) return;
        setCompleted(true);
        
        try {
            await api.submitResult({
                type: 'variation_complete',
                id: session.variation.id,
                hint_used: hintUsed,
                mode: 'opening_drill'
            });
            if (hintUsed) {
                setMessage("Line completed (with hint).");
            } else {
                setMessage("Correct! Line mastered.");
            }
            refreshUser();
            if (selectedOpeningId) {
                fetchStats(selectedOpeningId);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleMistake = async (fen: string, wrongMove: string, correctMove: string) => {
        if (!session || failed || completed) return;
        setFailed(true);
        
        try {
            await api.submitResult({
                type: 'blunder_made',
                id: session.variation.id,
                fen,
                wrong_move: wrongMove,
                correct_move: correctMove,
                mode: 'opening_drill'
            });
            setMessage("Incorrect move. The correct move was " + correctMove);
            if (selectedOpeningId) {
                fetchStats(selectedOpeningId);
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (!user || !user.is_authenticated) {
        return (
            <div className="text-center py-20">
                <h2 className="text-3xl font-semibold text-slate-900 dark:text-white mb-4">Training Locked</h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6">Please log in to access training modes.</p>
                <button
                    onClick={() => navigate('/login', { state: { backgroundLocation: location } })}
                    className="bg-indigo-500 text-white px-6 py-2 rounded-full hover:bg-indigo-400 transition shadow-lg shadow-indigo-900/40"
                >
                    Log In
                </button>
            </div>
        );
    }

    if (openingsLoading) return <div className="flex justify-center items-center h-64 text-slate-300">Loading openings...</div>;

    // Selection View (No opening selected)
    if (!selectedOpeningId) {
        return (
            <div className="w-full max-w-4xl mx-auto py-8 px-4">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-500/15 text-rose-200 rounded-full mb-4 border border-rose-400/30">
                        <Target size={32} />
                    </div>
                    <h1 className="text-3xl font-semibold text-slate-900 dark:text-white mb-3">Opening Drill</h1>
                    <p className="text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
                        Test your mastery. Select an opening to practice randomized variations without hints.
                        You must complete all lines in standard training to unlock drilling.
                    </p>
                </div>

                {availableOpenings.length === 0 ? (
                    <div className="text-center p-8 bg-slate-900/60 rounded-xl border border-dashed border-slate-700">
                        <p className="text-slate-400">No openings found.</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                        {availableOpenings.map(opening => (
                            <button
                                key={opening.slug}
                                onClick={() => opening.drill_unlocked && handleSelectOpening(opening.slug)}
                                disabled={!opening.drill_unlocked}
                                className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                                    opening.drill_unlocked
                                        ? 'bg-slate-900/70 border-slate-800 hover:border-rose-400/40 hover:shadow-rose-900/30 cursor-pointer group'
                                        : 'bg-slate-900/40 border-slate-800 opacity-70 cursor-not-allowed'
                                }`}
                            >
                                <div>
                                    <h3 className={`font-semibold ${opening.drill_unlocked ? 'text-white group-hover:text-rose-200' : 'text-slate-500'}`}>
                                        {opening.name}
                                    </h3>
                                    {!opening.drill_unlocked && (
                                        <p className="text-xs text-slate-500 mt-1">Train all variations to unlock</p>
                                    )}
                                </div>
                                <div>
                                    {opening.drill_unlocked ? (
                                        <ArrowRight className="text-slate-500 group-hover:text-rose-200" />
                                    ) : (
                                        <Lock className="text-slate-500" size={18} />
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    const unlockedOpenings = availableOpenings.filter(o => o.drill_unlocked);

    const srsStatus = session?.srs.status || 'learning';
    const statusLabel = srsStatus === 'mastered' ? 'Mastered' : srsStatus === 'due' ? 'Review' : 'Learning';
    const helperText = srsStatus === 'mastered'
        ? "This line is mastered and will appear less often."
        : srsStatus === 'due'
            ? "This line is scheduled for review. Keep it fresh!"
            : "We’ll repeat this line more often until you’re solid.";

    const masteredCount = stats?.mastered_variations ?? 0;
    const totalCount = stats?.total_variations ?? 0;
    const masteryPct = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0;

    // Drill Session View
    return (
        <main className="w-full max-w-7xl mx-auto py-2 px-3 sm:px-4 lg:px-6 text-slate-100">
            {/* Header / Back Button */}
            <div className="mb-2 flex items-center justify-between">
                <button
                    onClick={() => {
                        setSelectedOpeningId(null);
                        setSearchParams({});
                        setSession(null);
                    }}
                    className="text-slate-400 hover:text-white flex items-center gap-1 text-sm font-medium"
                >
                    &larr; Choose another opening
                </button>
            </div>

            <div className="space-y-2">
                {/* Training Card: Board + controls */}
                <section className="bg-slate-900/70 p-2 rounded-2xl shadow-2xl border border-slate-800 relative">
                    {sessionLoading ? (
                        <div className="flex flex-col items-center justify-center h-96 text-slate-400">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400 mb-2"></div>
                            Loading drill...
                        </div>
                    ) : session ? (
                        <>
                            <div className="mb-2 flex items-center gap-3">
                                <span className={clsx(
                                    "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border",
                                    srsStatus === 'mastered' ? "bg-emerald-500/20 text-emerald-100 border-emerald-400/30" :
                                    srsStatus === 'due' ? "bg-amber-500/20 text-amber-100 border-amber-400/30" :
                                    "bg-indigo-500/20 text-indigo-100 border-indigo-400/30"
                                )}>
                                    {statusLabel}
                                </span>
                                <span className="text-sm text-slate-400">{helperText}</span>
                            </div>

                            {(completed || failed) && (
                                <div className="absolute top-0 left-0 right-0 z-20 flex justify-center p-2">
                                    <div className={`w-full max-w-2xl rounded-lg border p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300 shadow-lg ${
                                        completed ? 'border-emerald-400/40 bg-emerald-900/40' : 'border-rose-400/40 bg-rose-900/30'
                                    }`}>
                                        <div className={`flex items-center gap-2 ${completed ? 'text-emerald-100' : 'text-rose-100'}`}>
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                                                completed ? 'bg-emerald-700 text-emerald-100' : 'bg-rose-700 text-rose-100'
                                            }`}>
                                                {completed ? <Trophy size={14} /> : <XCircle size={14} />}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-sm">
                                                    {completed ? "Success!" : "Failed Attempt"}
                                                </div>
                                                <div className="text-xs font-medium opacity-80">{message}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={fetchSession}
                                                className="inline-flex items-center gap-1 bg-indigo-500 text-white text-xs font-medium px-3 py-1.5 rounded-md hover:bg-indigo-400 transition shadow-lg shadow-indigo-900/40"
                                            >
                                                Next Line <ArrowRight size={12} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <GameArea
                                mode="sequence"
                                sessionTitle={`${session.opening.name} Drill`}
                                sessionType="new_learn" 
                                targetMoves={session.variation.moves}
                                orientation={session.variation.orientation}
                                onComplete={handleComplete}
                                onMistake={handleMistake}
                                locked={completed || failed}
                                opening={{ slug: session.opening.id, name: session.opening.name }}
                                openingOptions={unlockedOpenings.map(o => ({ slug: o.slug, name: o.name }))}
                                onSelectOpening={handleSelectOpening}
                                showInlineProgress={true}
                                headerMode="drill"
                            />
                        </>
                    ) : (
                        <div className="text-center py-20">
                            <h2 className="text-xl font-semibold text-white mb-2">{message || "Session not found"}</h2>
                            <button
                                onClick={fetchSession}
                                className="bg-indigo-500 text-white px-6 py-2 rounded-full hover:bg-indigo-400 transition shadow-lg shadow-indigo-900/40"
                            >
                                Retry
                            </button>
                        </div>
                    )}
                </section>

                {/* Mastery Progress */}
                {stats && (
                    <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3 shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <h3 className="text-lg font-semibold text-white">Lines mastered in this opening</h3>
                                <p className="text-sm text-slate-400">
                                    {masteredCount} / {totalCount} lines mastered • {masteryPct}%
                                </p>
                            </div>
                        </div>
                        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-300 rounded-full transition-all duration-500"
                                style={{ width: `${masteryPct}%` }}
                            />
                        </div>
                    </section>
                )}

                {/* Stats & Badges */}
                {stats && (
                    <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3 shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Trophy size={18} className="text-amber-300" />
                                <h3 className="text-lg font-semibold text-white">Stats & Badges</h3>
                            </div>
                            <button
                                onClick={() => setShowStats(prev => !prev)}
                                className="flex items-center gap-1 text-sm text-slate-400 hover:text-white"
                            >
                                {showStats ? 'Hide' : 'Show'} Stats
                                {showStats ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                        </div>

                        {showStats && (
                            <>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                                    <div className="bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/30">
                                        <div className="text-[10px] text-indigo-200 font-semibold uppercase tracking-wider mb-0.5">Mastery</div>
                                        <div className="text-xl font-bold text-white">
                                            {stats.mastered_variations} <span className="text-xs font-normal text-indigo-200">/ {stats.total_variations}</span>
                                        </div>
                                        <div className="text-[10px] text-indigo-100">{(stats.mastery_percentage * 100).toFixed(0)}%</div>
                                    </div>

                                    <div className="bg-purple-500/10 p-2 rounded-lg border border-purple-400/30">
                                        <div className="text-[10px] text-purple-200 font-semibold uppercase tracking-wider mb-0.5">Streak</div>
                                        <div className="flex items-end gap-2">
                                            <div className="text-xl font-bold text-white">{stats.current_flawless_streak}</div>
                                        </div>
                                         <div className="text-[10px] text-purple-100">Best: {stats.longest_flawless_streak}</div>
                                    </div>

                                    <div className="bg-amber-500/10 p-2 rounded-lg border border-amber-400/30">
                                        <div className="text-[10px] text-amber-100 font-semibold uppercase tracking-wider mb-0.5">Reviews</div>
                                        <div className="text-xl font-bold text-white">{stats.reviews_today}</div>
                                        <div className="text-[10px] text-amber-700">{stats.reviews_last_7_days} (7d)</div>
                                    </div>

                                    <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-400/30">
                                        <div className="text-[10px] text-emerald-100 font-semibold uppercase tracking-wider mb-0.5">Due</div>
                                        <div className="text-xl font-bold text-white">{stats.due_count}</div>
                                        <div className="text-[10px] text-emerald-100/80">{stats.learning_count} learn</div>
                                    </div>
                                </div>

                                <div className="mt-2">
                                    <h4 className="text-xs font-semibold text-slate-200 mb-2 flex items-center gap-2">
                                        <Medal size={14} className="text-amber-300" />
                                        Badges
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {badges.map(badge => (
                                            <div
                                                key={badge.id}
                                                className={clsx(
                                                    "group relative flex items-center gap-1.5 px-2 py-1.5 rounded-lg border transition-all cursor-help select-none",
                                                    badge.earned
                                                        ? "bg-amber-500/15 border-amber-400/30 shadow-sm"
                                                        : "bg-slate-900/60 border-slate-800 opacity-60"
                                                )}
                                                title={badge.description}
                                            >
                                                <div className={clsx(
                                                    "p-1 rounded-full",
                                                    badge.earned ? "bg-amber-400/30 text-amber-100" : "bg-slate-800 text-slate-500"
                                                )}>
                                                    <Star size={12} fill={badge.earned ? "currentColor" : "none"} />
                                                </div>
                                                
                                                {/* Tooltip */}
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-900 text-white text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center">
                                                    <div className="font-bold mb-1">{badge.name}</div>
                                                    {badge.description}
                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </section>
                )}
            </div>
        </main>
    );
};
