import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import type { RecallSessionResponse } from '../types';
import { GameArea } from '../components/GameArea';
import { useUser } from '../context/UserContext';
import { Trophy, ArrowRight, Filter, Target } from 'lucide-react';

export const Train: React.FC = () => {
    const { user, refreshUser } = useUser();
    const [searchParams, setSearchParams] = useSearchParams();
    const [session, setSession] = useState<RecallSessionResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [completed, setCompleted] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [openings, setOpenings] = useState<{ slug: string; name: string; variations: { id: string; name: string; label: string; locked?: boolean }[] }[]>([]);
    const [selectedOpening, setSelectedOpening] = useState<string | null>(null);
    const [selectedVariation, setSelectedVariation] = useState<string | null>(searchParams.get('id'));

    // Load available openings and variations
    useEffect(() => {
        api.getOpenings()
            .then(data => {
                const isPremium = Boolean(user?.effective_premium || user?.is_premium || user?.is_superuser || user?.is_staff);
                const flattened: { slug: string; name: string; variations: { id: string; name: string; label: string; locked?: boolean }[] }[] = [];
                Object.values(data).forEach(openingList => {
                    openingList.forEach(o => {
                        const vars = (isPremium ? o.variations : o.variations.filter(v => !v.locked)).map((v, idx) => ({
                            id: v.id,
                            name: v.name,
                            label: v.name || `Line #${idx + 1}`,
                            locked: v.locked
                        }));
                        if (vars.length > 0) {
                            flattened.push({ slug: o.id, name: o.name, variations: vars });
                        }
                    });
                });
                setOpenings(flattened);

                // Initialize selection if missing
                const currentVar = searchParams.get('id');
                if (!selectedOpening && !selectedVariation) {
                    const firstOpening = flattened[0];
                    if (firstOpening) {
                        setSelectedOpening(firstOpening.slug);
                        setSelectedVariation(firstOpening.variations[0]?.id || null);
                    }
                } else if (currentVar && !selectedVariation) {
                    // Infer opening from variation id if possible
                    const found = flattened.find(op => op.variations.some(v => v.id === currentVar));
                    if (found) {
                        setSelectedOpening(found.slug);
                        setSelectedVariation(currentVar);
                    }
                }
            })
            .catch(console.error);
    }, [user]);

    const openingOptions = useMemo(() => openings.map(o => ({ slug: o.slug, name: o.name })), [openings]);
    const currentOpening = openings.find(o => o.slug === selectedOpening) || openings[0];
    const lineOptions = currentOpening ? currentOpening.variations : [];

    useEffect(() => {
        if (!selectedOpening && currentOpening) {
            setSelectedOpening(currentOpening.slug);
        }
        if (!selectedVariation && currentOpening && currentOpening.variations.length > 0) {
            setSelectedVariation(currentOpening.variations[0].id);
        }
    }, [currentOpening, selectedOpening, selectedVariation]);

    const fetchSession = useCallback(async () => {
        setLoading(true);
        setCompleted(false);
        setMessage(null);
        try {
            const variationId = selectedVariation || searchParams.get('id');
            
            // Extract filters from URL
            const difficulties = searchParams.get('difficulties')?.split(',').filter(Boolean);
            const training_goals = searchParams.get('training_goals')?.split(',').filter(Boolean);
            const themes = searchParams.get('themes')?.split(',').filter(Boolean);
            
            const filters = (difficulties || training_goals || themes) ? {
                difficulties,
                training_goals,
                themes
            } : undefined;

            const data = await api.getRecallSession(variationId || undefined, filters);
            setSession(data);
            // Infer opening from response if provided
            if (!selectedOpening && 'opening' in data && (data as any).opening?.slug) {
                setSelectedOpening((data as any).opening.slug);
            }
            if (!selectedVariation && variationId) {
                setSelectedVariation(variationId);
            }
        } catch (err: any) {
            console.error("Failed to fetch session", err);
            if (err.response?.status === 403) {
                setMessage("You are out of stamina for today! Come back tomorrow.");
            } else if (err.response?.status === 404) {
                setMessage("No variations match your specific filters.");
            } else {
                setMessage("No training available right now.");
            }
        } finally {
            setLoading(false);
        }
    }, [searchParams, selectedVariation, selectedOpening]);

    useEffect(() => {
        fetchSession();
    }, [fetchSession]);

    const updateSearchWithVariation = (variationId: string) => {
        const next = new URLSearchParams(searchParams);
        if (variationId) {
            next.set('id', variationId);
        } else {
            next.delete('id');
        }
        setSearchParams(next);
    };

    const handleSelectOpening = (slug: string) => {
        const newOpening = openings.find(o => o.slug === slug);
        if (!newOpening) return;
        setSelectedOpening(slug);
        const firstVar = newOpening.variations[0]?.id || null;
        setSelectedVariation(firstVar);
        if (firstVar) {
            updateSearchWithVariation(firstVar);
        }
    };

    const handleSelectLine = (variationId: string) => {
        setSelectedVariation(variationId);
        updateSearchWithVariation(variationId);
    };

    const handleComplete = async (success: boolean, hintUsed: boolean) => {
        if (!session) return;
        setCompleted(true);
        
        try {
            if (session.type === 'mistake') {
                await api.submitResult({
                    type: 'mistake_fixed',
                    mistake_id: session.id,
                    hint_used: hintUsed
                });
                if (hintUsed) {
                    setMessage("Mistake corrected (with hint). Keep practicing!");
                } else {
                    setMessage("Mistake corrected! +10 XP");
                }
            } else {
                await api.submitResult({
                    type: 'variation_complete',
                    id: session.id,
                    hint_used: hintUsed
                });
                if (hintUsed) {
                    setMessage("Line completed (with hint). Keep practicing!");
                } else {
                    setMessage("Variation mastered! +20 XP");
                }
            }
            refreshUser(); // Update global stats
        } catch (err) {
            console.error(err);
        }
    };

    const handleMistake = async (fen: string, wrongMove: string, correctMove: string) => {
        if (!session) return;
        if (session.type === 'mistake') return; // Don't double count mistakes in mistake mode

        // Only report blunders for SRS/Learn modes
        try {
            await api.submitResult({
                type: 'blunder_made',
                id: (session as any).id, // Type cast for safety
                fen,
                wrong_move: wrongMove,
                correct_move: correctMove
            });
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
                    href="http://127.0.0.1:8000/admin/login/?next=/train" 
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    Log In
                </a>
            </div>
        );
    }

    if (loading) return <div className="flex justify-center items-center h-64">Loading session...</div>;
    
    if (!session) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{message || "All caught up!"}</h2>
                <p className="text-gray-500 mb-6">Try adjusting your filters or come back later.</p>
                <button 
                    onClick={fetchSession} 
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    Check Again
                </button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-6xl mx-auto">
            {/* Session Metadata Banner */}
            {!completed && (session.difficulty || session.training_goal || (session.themes && session.themes.length > 0)) && (
                <div className="mb-4 flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-top-1">
                    {session.difficulty && (
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full font-medium capitalize border border-gray-200">
                            {session.difficulty}
                        </span>
                    )}
                    {session.training_goal && (
                        <span className="text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded-full font-medium capitalize border border-purple-100 flex items-center gap-1">
                            <Target size={10} /> {session.training_goal}
                        </span>
                    )}
                    {session.themes?.map(t => (
                        <span key={t} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-medium capitalize border border-blue-100">
                            {t.replace(/_/g, ' ')}
                        </span>
                    ))}
                </div>
            )}

            <div className="bg-white p-2 sm:p-3 rounded-xl shadow-sm border border-gray-100">
                <GameArea
                    mode={session.type === 'mistake' ? 'mistake' : 'sequence'}
                    sessionTitle={session.type === 'mistake' ? session.variation_name : session.name}
                    sessionType={session.type}
                    initialFen={session.type === 'mistake' ? session.fen : undefined}
                    targetNextMove={session.type === 'mistake' ? session.correct_move : undefined}
                    targetMoves={session.type !== 'mistake' ? session.moves : undefined}
                    orientation={session.orientation}
                    onComplete={handleComplete}
                    onMistake={handleMistake}
                    locked={completed}
                    opening={
                        currentOpening
                            ? { slug: currentOpening.slug, name: currentOpening.name }
                            : undefined
                    }
                    openingOptions={openingOptions}
                    onSelectOpening={handleSelectOpening}
                    lineOptions={lineOptions.map(l => ({ id: l.id, label: l.label }))}
                    selectedLineId={selectedVariation || undefined}
                    onSelectLine={handleSelectLine}
                    headerMode="training"
                />

                {completed && (
                    <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-3 text-green-700">
                            <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0">
                                <Trophy size={16} />
                            </div>
                            <div>
                                <div className="font-bold text-green-800 text-sm">Session Complete</div>
                                <div className="text-xs font-medium text-green-700/80">{message}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    setCompleted(false);
                                    setMessage(null);
                                    fetchSession();
                                }}
                                className="text-xs font-medium text-blue-600 hover:text-blue-800 px-3 py-1.5 hover:bg-blue-50 rounded-md transition-colors"
                            >
                                Train Again
                            </button>
                            <button 
                                onClick={fetchSession} 
                                className="inline-flex items-center gap-1 bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-md hover:bg-blue-700 transition shadow-sm"
                            >
                                Next <ArrowRight size={12} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
