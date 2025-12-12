import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api/client';
import type { RecallSessionResponse } from '../types';
import { GameArea } from '../components/GameArea';
import { useUser } from '../context/UserContext';
import { Trophy, ArrowRight } from 'lucide-react';
import clsx from 'clsx';
import { Chess } from 'chess.js';

export const Train: React.FC = () => {
    const { user, refreshUser } = useUser();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [session, setSession] = useState<RecallSessionResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [completed, setCompleted] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [openings, setOpenings] = useState<{ slug: string; name: string; variations: { id: string; name: string; label: string; locked?: boolean }[] }[]>([]);
    const [selectedOpening, setSelectedOpening] = useState<string | null>(null);
    const [selectedVariation, setSelectedVariation] = useState<string | null>(searchParams.get('id'));
    
    const ONE_MOVE_REPERTOIRE_ONLY_KEY = 'one_move_repertoire_only';
    const didInitRepertoireOnlyRef = useRef(false);

    // Repertoire-only checkbox (user-controlled; persisted)
    const [useRepertoireOnly, setUseRepertoireOnly] = useState<boolean>(() => {
        try {
            const stored = localStorage.getItem(ONE_MOVE_REPERTOIRE_ONLY_KEY);
            if (stored !== null) return stored === 'true';
        } catch {
            // ignore localStorage errors (private mode, etc.)
        }
        return searchParams.get('repertoire_only') === 'true';
    });

    // Persist changes
    useEffect(() => {
        try {
            localStorage.setItem(ONE_MOVE_REPERTOIRE_ONLY_KEY, String(useRepertoireOnly));
        } catch {
            // ignore localStorage errors
        }
    }, [useRepertoireOnly]);

    const [hasRepertoire, setHasRepertoire] = useState(false);
    const sideParam = searchParams.get('side') as 'white' | 'black' | null;
    const openingFilter = searchParams.get('opening_id') || undefined;
    const hasSpecificOpening = Boolean(openingFilter);
    const isReviewMode = searchParams.get('mode') === 'review';
    const isOneMoveMode = searchParams.get('mode') === 'one_move';

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

                // Initialize selection based on opening filter or existing selection
                const currentVar = searchParams.get('id');
                const openingFromFilter = openingFilter ? flattened.find(op => op.slug === openingFilter) : null;
                if (openingFromFilter) {
                    setSelectedOpening(openingFromFilter.slug);
                    // Use the URL variation ID if it exists and belongs to this opening
                    const match = currentVar ? openingFromFilter.variations.find(v => v.id === currentVar) : null;
                    setSelectedVariation(match ? match.id : (openingFromFilter.variations[0]?.id || null));
                } else if (!selectedOpening && !selectedVariation) {
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

    // Load repertoire to drive the optional recall filter
    useEffect(() => {
        api.getRepertoire()
            .then(data => {
                const has = (data.white?.length ?? 0) + (data.black?.length ?? 0) > 0;
                setHasRepertoire(has);
                
                // Initialize the checkbox ONCE (only if user has no saved preference).
                if (!didInitRepertoireOnlyRef.current) {
                    let hasStored = false;
                    try {
                        hasStored = localStorage.getItem(ONE_MOVE_REPERTOIRE_ONLY_KEY) !== null;
                    } catch {
                        hasStored = false;
                    }

                    const hasUrlParam = searchParams.get('repertoire_only') !== null;
                    if (!hasStored && !hasUrlParam) {
                        setUseRepertoireOnly(has);
                    }
                    didInitRepertoireOnlyRef.current = true;
                }
            })
            .catch(() => {
                setHasRepertoire(false);
            });
    }, [user]);

    const openingOptions = useMemo(() => openings.map(o => ({ slug: o.slug, name: o.name })), [openings]);
    // In One Move Drill (no openingFilter), do not default to openings[0].
    // Only default if we are in a mode that implies browsing (but even then, maybe better not to).
    // Let's rely on openingFilter or manual selection.
    const currentOpening = openings.find(o => o.slug === (openingFilter || selectedOpening)) || openings.find(o => o.slug === selectedOpening);
    const lineOptions = currentOpening ? currentOpening.variations : [];

    useEffect(() => {
        // Only auto-select if we have a filter but for some reason selectedOpening isn't set yet
        if (openingFilter && !selectedOpening && currentOpening) {
            setSelectedOpening(currentOpening.slug);
        }
        // Legacy: if we wanted to default to first opening, we'd do it here, but we disabled that for One Move Drill.
    }, [currentOpening, selectedOpening, selectedVariation, openingFilter]);

    // If the URL opening_id changes, sync selection and clear old variation id
    useEffect(() => {
        if (openingFilter) {
            setSelectedOpening(openingFilter);
            if (!searchParams.get('id')) {
                setSelectedVariation(null);
            }
        }
    }, [openingFilter, searchParams]);

    const fetchOneMoveSession = useCallback(async () => {
        // Generic One Move Drill: do NOT send opening_id or variation id.
        const filters = {
            use_repertoire_only: useRepertoireOnly && hasRepertoire,
            side: sideParam || undefined,
            mode: 'one_move' as const,
            t: Date.now(),
        };
        return await api.getRecallSession(undefined, filters);
    }, [useRepertoireOnly, hasRepertoire, sideParam]);

    const fetchSpecificOpeningSession = useCallback(async (openingId: string, variationId?: string) => {
        // Specific opening flow (review / specific opening training / one-move-within-opening).
        const difficulties = searchParams.get('difficulties')?.split(',').filter(Boolean);
        const training_goals = searchParams.get('training_goals')?.split(',').filter(Boolean);
        const themes = searchParams.get('themes')?.split(',').filter(Boolean);

        const filters = {
            difficulties,
            training_goals,
            themes,
            use_repertoire_only: useRepertoireOnly && hasRepertoire,
            side: sideParam || undefined,
            opening_id: openingId,
            mode: isOneMoveMode ? 'one_move' : undefined,
            t: Date.now(),
        };

        return await api.getRecallSession(variationId, filters);
    }, [searchParams, useRepertoireOnly, hasRepertoire, sideParam, isOneMoveMode]);

    const fetchSession = useCallback(async () => {
        setLoading(true);
        setCompleted(false);
        setMessage(null);
        try {
            // One Move Drill: randomize across openings unless explicitly in a specific-opening flow.
            if (isOneMoveMode && !openingFilter) {
                const data = await fetchOneMoveSession();
                setSession(data);
                return;
            }

            // Fix: For One Move Drill (specific-opening flow), ignore specific variation ID to ensure randomization
            const variationId = isOneMoveMode ? undefined : (selectedVariation || searchParams.get('id') || undefined);

            // Extract filters from URL
            const difficulties = searchParams.get('difficulties')?.split(',').filter(Boolean);
            const training_goals = searchParams.get('training_goals')?.split(',').filter(Boolean);
            const themes = searchParams.get('themes')?.split(',').filter(Boolean);

            // If we're training a specific opening, keep sending opening_id (explicit flow).
            if (openingFilter) {
                const data = await fetchSpecificOpeningSession(openingFilter, variationId);
                setSession(data);
                if (!selectedVariation && variationId) {
                    setSelectedVariation(variationId);
                }
                return;
            }

            const filters = (difficulties || training_goals || themes || (useRepertoireOnly && hasRepertoire) || sideParam || isOneMoveMode) ? {
                difficulties,
                training_goals,
                themes,
                use_repertoire_only: useRepertoireOnly && hasRepertoire,
                side: sideParam || undefined,
                mode: isOneMoveMode ? 'one_move' : undefined,
                t: Date.now() // Cache buster
            } : { t: Date.now() };

            const data = await api.getRecallSession(variationId, filters);
            setSession(data);
            
            // Only set selectedOpening if we are strictly filtering by it (which we handled via useEffect/initial state)
            // or if we want to lock it. But for One Move Drill, we don't want to lock it.
            // So we remove the auto-set logic here to keep One Move Drill "generic".
            
            if (!selectedVariation && variationId) {
                setSelectedVariation(variationId);
            }
        } catch (err: any) {
            console.error("Failed to fetch session", err);
            if (err.response?.status === 403) {
                const msg = err.response?.data?.error || err.response?.data?.message;
                if (msg && (msg.includes("stamina") || msg.includes("limit"))) {
                    setMessage("You are out of stamina for today! Come back tomorrow.");
                } else if (msg && (msg.includes("locked") || msg.includes("premium"))) {
                     setMessage("This variation is premium-only. Log in or upgrade to access.");
                } else {
                    setMessage("Access denied. Please check your account status.");
                }
            } else if (err.response?.status === 404) {
                setMessage("No variations match your specific filters.");
            } else {
                setMessage("No training available right now.");
            }
        } finally {
            setLoading(false);
        }
    }, [
        searchParams,
        selectedVariation,
        useRepertoireOnly,
        hasRepertoire,
        sideParam,
        openingFilter,
        isOneMoveMode,
        fetchOneMoveSession,
        fetchSpecificOpeningSession,
    ]);

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
        
        const isGuest = !user || !user.is_authenticated;

        // One Move Drill: Immediate next session
        if (isOneMoveMode) {
            try {
                // For guests, we still call submit to trigger "next" logic if needed, 
                // but backend won't save. Frontend can just fetch next.
                await api.submitResult({
                    type: 'one_move_complete',
                    success: success && !hintUsed,
                    mode: 'one_move'
                });
                if (!isGuest) refreshUser();
                // Fetch next session immediately
                fetchSession();
            } catch (err) {
                console.error(err);
            }
            return;
        }

        setCompleted(true);
        
        try {
            if (session.type === 'mistake') {
                await api.submitResult({
                    type: 'mistake_fixed',
                    mistake_id: session.id,
                    hint_used: hintUsed
                });
                if (hintUsed) {
                    setMessage("Mistake corrected (with hint).");
                } else if (isGuest) {
                    setMessage("Mistake corrected!");
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
                    setMessage("Line completed (with hint).");
                } else if (isGuest) {
                    setMessage("Variation completed! (Log in to save progress)");
                } else {
                    setMessage("Variation mastered! +20 XP");
                }
            }
            if (!isGuest) refreshUser(); // Update global stats
        } catch (err) {
            console.error(err);
        }
    };

    const handleMistake = async (fen: string, wrongMove: string, correctMove: string) => {
        if (!session) return;
        if (session.type === 'mistake') return; // Don't double count mistakes in mistake mode

        const isGuest = !user || !user.is_authenticated;

        // One Move Drill: Handle mistake and next
        if (isOneMoveMode) {
            try {
                // Log mistake
                await api.submitResult({
                    type: 'blunder_made',
                    id: (session as any).id,
                    fen,
                    wrong_move: wrongMove,
                    correct_move: correctMove,
                    mode: 'one_move'
                });
                
                // Submit result to reset streak
                await api.submitResult({
                    type: 'one_move_complete',
                    success: false,
                    mode: 'one_move'
                });
                if (!isGuest) refreshUser();
                
                // Fetch next session immediately
                // setTimeout(() => {
                    fetchSession();
                // }, 1000); 
            } catch (err) {
                console.error(err);
            }
            return;
        }

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

    // Blocking check removed to allow Guest Training
    // if (!user || !user.is_authenticated) { ... }

    const oneMoveSession = useMemo(() => {
        if (!isOneMoveMode || !session || session.type === 'mistake' || !session.moves) return null;
        
        try {
            const game = new Chess();
            const candidateMoves: { fen: string; move: string; moveIndex: number }[] = [];
            
            // Replay game to find all user moves
            session.moves.forEach((move, idx) => {
                const turn = game.turn(); // 'w' or 'b'
                const userColor = session.orientation === 'white' ? 'w' : 'b';
                const fenBefore = game.fen();
                
                if (turn === userColor) {
                    candidateMoves.push({
                        fen: fenBefore,
                        move: move.san,
                        moveIndex: idx
                    });
                }
                game.move(move.san);
            });
            
            if (candidateMoves.length === 0) return null;
            
            // Pick a random move to test
            // In a real SRS system, we might pick the specific move that is "due".
            // For now, random selection from the line is a good "drill".
            const selected = candidateMoves[Math.floor(Math.random() * candidateMoves.length)];
            
            return {
                ...session,
                type: 'mistake' as const, // Treat as single-move puzzle
                fen: selected.fen,
                correct_move: selected.move,
                variation_name: session.name,
                // We keep the opening metadata
            };
        } catch (e) {
            console.error("Error generating one-move puzzle", e);
            return null;
        }
    }, [session, isOneMoveMode]);

    const activeSession = isOneMoveMode && oneMoveSession ? oneMoveSession : session;

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
            {/* Session Metadata Banner - Hidden in Train Mode for now */}
            {/* {!completed && !hasSpecificOpening && !isOneMoveMode && (session.difficulty || session.training_goal || (session.themes && session.themes.length > 0)) && (
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
            )} */}

            <div className="bg-white p-2 sm:p-3 rounded-xl shadow-sm border border-gray-100 relative">
                {completed && (
                    <div className="absolute top-0 left-0 right-0 z-20 flex justify-center p-2">
                        <div className="w-full max-w-2xl rounded-lg border border-green-200 bg-green-50 p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300 shadow-lg">
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
                                    Try again
                                </button>
                                {isReviewMode ? (
                                    <button 
                                        onClick={() => navigate('/openings')} 
                                        className="inline-flex items-center gap-1 bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-md hover:bg-blue-700 transition shadow-sm"
                                    >
                                        Train another opening <ArrowRight size={12} />
                                    </button>
                                ) : (
                                    <button 
                                        onClick={fetchSession} 
                                        className="inline-flex items-center gap-1 bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-md hover:bg-blue-700 transition shadow-sm"
                                    >
                                        Next <ArrowRight size={12} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                {!hasSpecificOpening && (
                    <div className="mb-3 flex items-start gap-3">
                        <input
                            type="checkbox"
                            id="use-repertoire-only"
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={hasRepertoire && useRepertoireOnly}
                            disabled={!hasRepertoire}
                            onChange={(e) => {
                                const next = e.target.checked;
                                didInitRepertoireOnlyRef.current = true;
                                setUseRepertoireOnly(next);
                                try {
                                    localStorage.setItem(ONE_MOVE_REPERTOIRE_ONLY_KEY, String(next));
                                } catch {
                                    // ignore localStorage errors
                                }
                            }}
                        />
                        <label htmlFor="use-repertoire-only" className={clsx("flex flex-col text-sm", !hasRepertoire && "text-gray-400")}>
                            <span className="font-semibold text-gray-800">Use my repertoire only</span>
                            <span className="text-xs text-gray-500">If enabled, recall uses only your repertoire openings for this side.</span>
                            {!hasRepertoire && (
                                <span className="text-[11px] text-gray-400 mt-1">Add openings to your repertoire to enable this.</span>
                            )}
                        </label>
                    </div>
                )}
                <GameArea
                    mode={activeSession?.type === 'mistake' ? 'mistake' : 'sequence'}
                    sessionTitle={activeSession?.type === 'mistake' ? (activeSession as any).variation_name : activeSession?.name}
                    sessionType={activeSession?.type}
                    initialFen={activeSession?.type === 'mistake' ? (activeSession as any).fen : undefined}
                    targetNextMove={activeSession?.type === 'mistake' ? (activeSession as any).correct_move : undefined}
                    targetMoves={activeSession?.type !== 'mistake' ? (activeSession as any).moves : undefined}
                    orientation={activeSession?.orientation}
                    onComplete={handleComplete}
                    onMistake={handleMistake}
                    locked={completed}
                    opening={
                        (isOneMoveMode && session && 'opening' in session && session.opening) 
                            ? { slug: session.opening.slug, name: session.opening.name }
                            : (currentOpening
                                ? { slug: currentOpening.slug, name: currentOpening.name }
                                : (session && 'opening' in session && session.opening ? { slug: session.opening.slug, name: session.opening.name } : undefined))
                    }
                    openingOptions={openingOptions}
                    onSelectOpening={handleSelectOpening}
                    lineOptions={lineOptions.map(l => ({ id: l.id, label: l.label }))}
                    selectedLineId={selectedVariation || undefined}
                    onSelectLine={handleSelectLine}
                    headerMode="training"
                    hideLog={isOneMoveMode}
                    isOneMoveMode={isOneMoveMode}
                />
            </div>
        </div>
    );
};
