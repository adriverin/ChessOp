import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
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
            .catch(console.error)
            .finally(() => setOpeningsLoading(false));
    }, [user, searchParams, setSearchParams]);

    const fetchStats = useCallback(async (openingId: string) => {
        try {
            const data = await api.getOpeningDrillStats(openingId);
            setStats(data.stats);
            setBadges(data.badges);
        } catch (err) {
            console.error('Failed to fetch stats', err);
        }
    }, []);

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
    }, [selectedOpeningId]);

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
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Training Locked</h2>
                <p className="text-gray-500 mb-6">Please log in to access training modes.</p>
                <a 
                    href="/admin/login/?next=/drill" 
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    Log In
                </a>
            </div>
        );
    }

    if (openingsLoading) return <div className="flex justify-center items-center h-64">Loading openings...</div>;

    // Selection View (No opening selected)
    if (!selectedOpeningId) {
        return (
            <div className="w-full max-w-4xl mx-auto py-8 px-4">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 text-red-600 rounded-full mb-4">
                        <Target size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Opening Drill</h1>
                    <p className="text-gray-600 max-w-lg mx-auto">
                        Test your mastery. Select an opening to practice randomized variations without hints. 
                        You must complete all lines in standard training to unlock drilling.
                    </p>
                </div>

                {availableOpenings.length === 0 ? (
                    <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-500">No openings found.</p>
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
                                        ? 'bg-white border-gray-200 hover:border-red-300 hover:shadow-md cursor-pointer group' 
                                        : 'bg-gray-50 border-gray-200 opacity-75 cursor-not-allowed'
                                }`}
                            >
                                <div>
                                    <h3 className={`font-bold ${opening.drill_unlocked ? 'text-gray-900 group-hover:text-red-600' : 'text-gray-500'}`}>
                                        {opening.name}
                                    </h3>
                                    {!opening.drill_unlocked && (
                                        <p className="text-xs text-gray-500 mt-1">Train all variations to unlock</p>
                                    )}
                                </div>
                                <div>
                                    {opening.drill_unlocked ? (
                                        <ArrowRight className="text-gray-300 group-hover:text-red-500" />
                                    ) : (
                                        <Lock className="text-gray-400" size={18} />
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
        <main className="w-full max-w-7xl mx-auto py-2 px-3 sm:px-4 lg:px-6">
            {/* Header / Back Button */}
            <div className="mb-2 flex items-center justify-between">
                <button 
                    onClick={() => {
                        setSelectedOpeningId(null);
                        setSearchParams({});
                        setSession(null);
                    }}
                    className="text-gray-500 hover:text-gray-800 flex items-center gap-1 text-sm font-medium"
                >
                    &larr; Choose another opening
                </button>
            </div>

            <div className="space-y-2">
                {/* Training Card: Board + controls */}
                <section className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 relative">
                    {sessionLoading ? (
                        <div className="flex flex-col items-center justify-center h-96 text-gray-500">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
                            Loading drill...
                        </div>
                    ) : session ? (
                        <>
                            <div className="mb-2 flex items-center gap-3">
                                <span className={clsx(
                                    "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border",
                                    srsStatus === 'mastered' ? "bg-green-50 text-green-700 border-green-200" :
                                    srsStatus === 'due' ? "bg-amber-50 text-amber-700 border-amber-200" :
                                    "bg-blue-50 text-blue-700 border-blue-200"
                                )}>
                                    {statusLabel}
                                </span>
                                <span className="text-sm text-gray-600">{helperText}</span>
                            </div>

                            {(completed || failed) && (
                                <div className="absolute top-0 left-0 right-0 z-20 flex justify-center p-2">
                                    <div className={`w-full max-w-2xl rounded-lg border p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300 shadow-lg ${
                                        completed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                                    }`}>
                                        <div className={`flex items-center gap-2 ${completed ? 'text-green-700' : 'text-red-700'}`}>
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                                                completed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                            }`}>
                                                {completed ? <Trophy size={14} /> : <XCircle size={14} />}
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm">
                                                    {completed ? "Success!" : "Failed Attempt"}
                                                </div>
                                                <div className="text-xs font-medium opacity-80">{message}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={fetchSession} 
                                                className="inline-flex items-center gap-1 bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-md hover:bg-blue-700 transition shadow-sm"
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
                            <h2 className="text-xl font-bold text-gray-800 mb-2">{message || "Session not found"}</h2>
                            <button 
                                onClick={fetchSession} 
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                            >
                                Retry
                            </button>
                        </div>
                    )}
                </section>

                {/* Mastery Progress */}
                {stats && (
                    <section className="bg-white border border-gray-200 rounded-2xl p-3 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Lines mastered in this opening</h3>
                                <p className="text-sm text-gray-600">
                                    {masteredCount} / {totalCount} lines mastered • {masteryPct}%
                                </p>
                            </div>
                        </div>
                        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                style={{ width: `${masteryPct}%` }}
                            />
                        </div>
                    </section>
                )}

                {/* Stats & Badges */}
                {stats && (
                    <section className="bg-white border border-gray-200 rounded-2xl p-3 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Trophy size={18} className="text-yellow-500" />
                                <h3 className="text-lg font-bold text-gray-900">Stats & Badges</h3>
                            </div>
                            <button
                                onClick={() => setShowStats(prev => !prev)}
                                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                            >
                                {showStats ? 'Hide' : 'Show'} Stats
                                {showStats ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                        </div>

                        {showStats && (
                            <>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                                    <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
                                        <div className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider mb-0.5">Mastery</div>
                                        <div className="text-xl font-bold text-blue-900">
                                            {stats.mastered_variations} <span className="text-xs font-normal text-blue-600">/ {stats.total_variations}</span>
                                        </div>
                                        <div className="text-[10px] text-blue-700">{(stats.mastery_percentage * 100).toFixed(0)}%</div>
                                    </div>

                                    <div className="bg-purple-50 p-2 rounded-lg border border-purple-100">
                                        <div className="text-[10px] text-purple-600 font-semibold uppercase tracking-wider mb-0.5">Streak</div>
                                        <div className="flex items-end gap-2">
                                            <div className="text-xl font-bold text-purple-900">{stats.current_flawless_streak}</div>
                                        </div>
                                         <div className="text-[10px] text-purple-700">Best: {stats.longest_flawless_streak}</div>
                                    </div>

                                    <div className="bg-amber-50 p-2 rounded-lg border border-amber-100">
                                        <div className="text-[10px] text-amber-600 font-semibold uppercase tracking-wider mb-0.5">Reviews</div>
                                        <div className="text-xl font-bold text-amber-900">{stats.reviews_today}</div>
                                        <div className="text-[10px] text-amber-700">{stats.reviews_last_7_days} (7d)</div>
                                    </div>

                                    <div className="bg-green-50 p-2 rounded-lg border border-green-100">
                                        <div className="text-[10px] text-green-600 font-semibold uppercase tracking-wider mb-0.5">Due</div>
                                        <div className="text-xl font-bold text-green-900">{stats.due_count}</div>
                                        <div className="text-[10px] text-green-700">{stats.learning_count} learn</div>
                                    </div>
                                </div>

                                <div className="mt-2">
                                    <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        <Medal size={14} />
                                        Badges
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {badges.map(badge => (
                                            <div
                                                key={badge.id}
                                                className={clsx(
                                                    "group relative flex items-center gap-1.5 px-2 py-1.5 rounded-lg border transition-all cursor-help select-none",
                                                    badge.earned 
                                                        ? "bg-gradient-to-br from-yellow-50 to-amber-50 border-amber-200 shadow-sm" 
                                                        : "bg-gray-50 border-gray-200 opacity-60 grayscale"
                                                )}
                                                title={badge.description}
                                            >
                                                <div className={clsx(
                                                    "p-1 rounded-full",
                                                    badge.earned ? "bg-amber-100 text-amber-600" : "bg-gray-200 text-gray-400"
                                                )}>
                                                    <Star size={12} fill={badge.earned ? "currentColor" : "none"} />
                                                </div>
                                                
                                                {/* Tooltip */}
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center">
                                                    <div className="font-bold mb-1">{badge.name}</div>
                                                    {badge.description}
                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
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
