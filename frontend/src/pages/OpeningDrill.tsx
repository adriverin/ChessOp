import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import type { OpeningDrillOpening } from '../api/client';
import type { OpeningDrillResponse, OpeningDrillProgressResponse } from '../types';
import { GameArea } from '../components/GameArea';
import { useUser } from '../context/UserContext';
import { Trophy, ArrowRight, XCircle, Lock, Target } from 'lucide-react';

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
    const [progress, setProgress] = useState<OpeningDrillProgressResponse | null>(null);
    const [progressLoading, setProgressLoading] = useState(false);

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

    const fetchProgress = useCallback(async (openingId: string) => {
        setProgressLoading(true);
        try {
            const data = await api.getOpeningDrillProgress(openingId);
            setProgress(data);
        } catch (err) {
            console.error('Failed to fetch drill progress', err);
            setProgress(null);
        } finally {
            setProgressLoading(false);
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
            fetchProgress(selectedOpeningId);
            fetchSession();
        } else {
            setSession(null);
            setProgress(null);
        }
    }, [selectedOpeningId, fetchSession, fetchProgress]);

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
                fetchProgress(selectedOpeningId);
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
                fetchProgress(selectedOpeningId);
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

    // Drill Session View
    return (
        <div className="w-full max-w-6xl mx-auto py-4">
            {/* Header / Back Button */}
            <div className="mb-4 flex items-center justify-between">
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

            {/* Progress Overview */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900">Drill Progress</h3>
                    {progressLoading && <span className="text-xs text-gray-500">Updating...</span>}
                </div>
                {progress && (
                    <>
                        {(() => {
                            const total = progress.progress.length;
                            const due = progress.progress.filter(p => p.status === 'due').length;
                            const learning = progress.progress.filter(p => p.status === 'learning').length;
                            const mastered = total - due - learning;
                            return (
                                <div className="flex flex-wrap gap-3 text-sm mb-3">
                                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full font-semibold">{due} due</span>
                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full font-semibold">{learning} learning</span>
                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full font-semibold">{mastered} mastered</span>
                                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full font-semibold">{total} total lines</span>
                                </div>
                            );
                        })()}
                        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                            {progress.progress.map(item => {
                                const isDue = item.status === 'due';
                                const isLearning = item.status === 'learning';
                                const badge = isDue ? 'bg-red-100 text-red-700 border-red-200' : isLearning ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-green-100 text-green-700 border-green-200';
                                const statusLabel = isDue ? 'Due' : isLearning ? 'Learning' : 'Mastered';
                                return (
                                    <div key={item.variation_id} className={`p-3 rounded-lg border ${badge} text-sm`}>
                                        <div className="font-semibold">Line #{item.line_number}</div>
                                        <div className="text-xs mt-1 space-y-0.5">
                                            <div>Status: {statusLabel}</div>
                                            <div>EF: {item.ease_factor.toFixed(2)} | Streak: {item.streak}</div>
                                            <div>Interval: {item.interval_days.toFixed(1)} days</div>
                                            <div>Due: {item.due_date ? new Date(item.due_date).toLocaleDateString() : 'N/A'}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
                {!progress && !progressLoading && (
                    <div className="text-sm text-gray-500">Progress data not available.</div>
                )}
            </div>

            <div className="bg-white p-2 sm:p-3 rounded-xl shadow-sm border border-gray-100 min-h-[500px]">
                {sessionLoading ? (
                    <div className="flex flex-col items-center justify-center h-96 text-gray-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
                        Loading drill...
                    </div>
                ) : session ? (
                    <>
                        {/* Current SRS Metadata */}
                        <div className="mb-3 flex flex-wrap gap-2 text-xs">
                            <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 font-semibold">
                                Streak: {session.srs.streak}
                            </span>
                            <span className="px-2 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-100 font-semibold">
                                EF: {session.srs.ease_factor.toFixed(2)}
                            </span>
                            <span className="px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-100 font-semibold">
                                Interval: {session.srs.interval_days.toFixed(1)} days
                            </span>
                            <span className="px-2 py-1 rounded-full bg-gray-50 text-gray-700 border border-gray-100 font-semibold">
                                Due: {session.srs.due_date ? new Date(session.srs.due_date).toLocaleDateString() : 'N/A'}
                            </span>
                        </div>

                        <GameArea
                            mode="sequence"
                            sessionTitle={`${session.opening.name} Drill`}
                            sessionType="new_learn" 
                            targetMoves={session.variation.moves}
                            orientation={session.variation.orientation}
                            onComplete={handleComplete}
                            onMistake={handleMistake}
                            locked={completed || failed}
                        />

                        {(completed || failed) && (
                            <div className={`mt-4 rounded-lg border p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300 ${
                                completed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                            }`}>
                                <div className={`flex items-center gap-3 ${completed ? 'text-green-700' : 'text-red-700'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                        completed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                    }`}>
                                        {completed ? <Trophy size={16} /> : <XCircle size={16} />}
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
                        )}
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
            </div>
        </div>
    );
};
