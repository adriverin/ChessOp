import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api/client';
import type { OpeningsResponse, RecallSessionResponse } from '../types';
import type { MistakeListItem } from '../api/client';
import { GameArea } from '../components/GameArea';
import { GuestModeBanner } from '../components/GuestModeBanner';
import { useUser } from '../context/UserContext';
import { Trophy, ArrowRight } from 'lucide-react';
import clsx from 'clsx';
import { Chess } from 'chess.js';
import { TrainingArena } from '../components/TrainingArena/components';
import type { Difficulty as ArenaDifficulty, Side as ArenaSide } from '../components/TrainingArena/types';

export const Train: React.FC = () => {
    const { user, refreshUser, loading: userLoading } = useUser();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
    const isPremiumUser = Boolean(user?.effective_premium || user?.is_premium || user?.is_superuser || user?.is_staff);
    const isGuestUser = !user?.is_authenticated;

    const shouldAutoStart =
        searchParams.has('mistake_id') ||
        searchParams.has('mode') ||
        searchParams.has('opening_id') ||
        searchParams.has('id') ||
        searchParams.has('difficulties') ||
        searchParams.has('training_goals') ||
        searchParams.has('themes') ||
        searchParams.has('side') ||
        searchParams.has('repertoire_only');

    const [showEntry, setShowEntry] = useState<boolean>(() => !shouldAutoStart);
    const [session, setSession] = useState<RecallSessionResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(() => shouldAutoStart);
    const [completed, setCompleted] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [openingsResponse, setOpeningsResponse] = useState<OpeningsResponse | null>(null);
    const [mistakes, setMistakes] = useState<MistakeListItem[]>([]);
    const [repertoireOpeningIds, setRepertoireOpeningIds] = useState<Set<string>>(() => new Set());
    const [staminaExhausted, setStaminaExhausted] = useState(false);
    const [openings, setOpenings] = useState<{ slug: string; name: string; variations: { id: string; name: string; label: string; locked?: boolean }[] }[]>([]);
    const [selectedOpening, setSelectedOpening] = useState<string | null>(null);
    const [selectedVariation, setSelectedVariation] = useState<string | null>(searchParams.get('id'));

    const ONE_MOVE_REPERTOIRE_ONLY_KEY = 'one_move_repertoire_only';
    const PREMIUM_LOCK_MESSAGE_KEY = 'premium_line_locked';
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
    // Keep Design OS quick-start toggle in sync with existing stored value.
    useEffect(() => {
        try {
            localStorage.setItem('trainingArena.repertoireOnly', String(useRepertoireOnly));
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
                setOpeningsResponse(data);
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
                setRepertoireOpeningIds(new Set([
                    ...(data.white ?? []).map((o) => o.opening_id),
                    ...(data.black ?? []).map((o) => o.opening_id),
                ]));

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
                setRepertoireOpeningIds(new Set());
            });
    }, [user]);

    const refreshMistakes = useCallback(async () => {
        if (!user?.is_authenticated) {
            setMistakes([]);
            return;
        }
        try {
            const data = await api.getMistakes();
            setMistakes(data.mistakes);
        } catch {
            setMistakes([]);
        }
    }, [user?.is_authenticated]);

    useEffect(() => {
        void refreshMistakes();
    }, [refreshMistakes]);

    function inferArenaSide(tags: string[]): ArenaSide {
        return tags.includes('Black') ? 'black' : 'white';
    }

    function mapArenaDifficulty(value: string | undefined): ArenaDifficulty {
        if (value === 'beginner' || value === 'intermediate' || value === 'advanced') return value;
        return 'advanced';
    }

    const arenaOpenings = useMemo(() => {
        if (!openingsResponse) return [];
        const result: Array<{
            id: string;
            name: string;
            description: string;
            side: ArenaSide;
            eco: string;
            imageUrl: string;
            variationCount: number;
            isPremium: boolean;
        }> = [];
        Object.values(openingsResponse).forEach((openingList) => {
            openingList.forEach((o) => {
                result.push({
                    id: o.id,
                    name: o.name,
                    description: '',
                    side: inferArenaSide(o.tags),
                    eco: '',
                    imageUrl: '',
                    variationCount: o.variations.length,
                    isPremium: false,
                });
            });
        });
        return result;
    }, [openingsResponse]);

    const arenaVariations = useMemo(() => {
        if (!openingsResponse) return [];
        const result: Array<{
            id: string;
            openingId: string;
            name: string;
            description: string;
            moves: string;
            moveCount: number;
            difficulty: ArenaDifficulty;
            isPremium: boolean;
            isLocked: boolean;
            isInRepertoire: boolean;
        }> = [];
        Object.values(openingsResponse).forEach((openingList) => {
            openingList.forEach((opening) => {
                const isInRepertoire = repertoireOpeningIds.has(opening.id);
                const isLocked = !Boolean(opening.drill_mode_unlocked);
                opening.variations.forEach((v) => {
                    const moveSans = (v.moves ?? []).map((m) => m.san).join(' ');
                    result.push({
                        id: v.id,
                        openingId: opening.id,
                        name: v.name,
                        description: '',
                        moves: moveSans,
                        moveCount: (v.moves ?? []).length,
                        difficulty: mapArenaDifficulty(v.difficulty),
                        isPremium: Boolean(v.locked),
                        isLocked,
                        isInRepertoire,
                    });
                });
            });
        });
        return result;
    }, [openingsResponse, repertoireOpeningIds]);

    const variationsLearned = useMemo(() => {
        if (!openingsResponse) return 0;
        let count = 0;
        Object.values(openingsResponse).forEach((openingList) => {
            openingList.forEach((opening) => {
                opening.variations.forEach((v) => {
                    if (v.completed) count += 1;
                });
            });
        });
        return count;
    }, [openingsResponse]);

    const arenaUserMistakes = useMemo(() => {
        return mistakes.map((m) => ({
            id: m.id,
            variationId: m.variation_id ?? 'unknown',
            fen: m.fen,
            wrongMove: m.wrong_move,
            correctMove: m.correct_move,
            explanation: 'Review this position and play the best move.',
            occurredAt: m.created_at,
            reviewedCount: 0,
            lastReviewedAt: null,
        }));
    }, [mistakes]);

    const arenaUserStats = useMemo(() => {
        const staminaMax = user?.daily_moves_max ?? 20;
        const staminaRemainingRaw = user?.daily_moves_remaining ?? staminaMax;
        const staminaRemaining = staminaExhausted && !isPremiumUser ? 0 : staminaRemainingRaw;

        return {
            totalXp: user?.xp ?? 0,
            level: user?.level ?? 1,
            currentStreak: user?.one_move_current_streak ?? 0,
            longestStreak: user?.one_move_best_streak ?? 0,
            staminaRemaining: isGuestUser ? staminaMax : staminaRemaining,
            staminaMax,
            dueReviews: 0,
            variationsLearned,
            totalMistakes: mistakes.length,
            mistakesFixed: 0,
        };
    }, [user, isGuestUser, isPremiumUser, staminaExhausted, variationsLearned, mistakes.length]);

    const openingOptions = useMemo(() => openings.map(o => ({ slug: o.slug, name: o.name })), [openings]);
    // In One Move Drill (no openingFilter), do not default to openings[0].
    // Only default if we are in a mode that implies browsing (but even then, maybe better not to).
    // Let's rely on openingFilter or manual selection.
    const currentOpening = openings.find(o => o.slug === (openingFilter || selectedOpening)) || openings.find(o => o.slug === selectedOpening);
    const lineOptions = currentOpening ? currentOpening.variations : [];
    const displayedLineOptions = useMemo(() => {
        if (isOneMoveMode && session && session.type !== 'mistake') {
            return [{ id: session.id, label: session.name }];
        }
        return lineOptions;
    }, [isOneMoveMode, session, lineOptions]);

    const displayedSelectedLineId = useMemo(() => {
        if (isOneMoveMode && session && session.type !== 'mistake') {
            return session.id;
        }
        return selectedVariation || undefined;
    }, [isOneMoveMode, session, selectedVariation]);

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
            setStaminaExhausted(false);
            const mistakeId = searchParams.get('mistake_id') || undefined;
            if (mistakeId) {
                const data = await api.getRecallSession(undefined, { t: Date.now() }, undefined, mistakeId);
                setSession(data);
                return;
            }

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
                    setStaminaExhausted(true);
                } else if (msg && (msg.includes("locked") || msg.includes("premium"))) {
                    setMessage(PREMIUM_LOCK_MESSAGE_KEY);
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
        if (showEntry) return;
        fetchSession();
    }, [fetchSession, showEntry]);

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

    const handleArenaSignUp = () => {
        navigate('/signup', { state: { backgroundLocation: location } });
    };

    const setParam = (key: string, value: string | null) => {
        const next = new URLSearchParams(searchParams);
        if (value === null || value === '') next.delete(key);
        else next.set(key, value);
        setSearchParams(next);
    };

    const handleArenaStartSession = (mode: 'opening-training' | 'one-move-drill' | 'opening-drill', openingId?: string, variationId?: string) => {
        if (mode === 'opening-drill') {
            if (openingId) navigate(`/drill?opening_id=${encodeURIComponent(openingId)}`);
            else navigate('/drill');
            return;
        }

        const next = new URLSearchParams(searchParams);
        next.delete('mistake_id');
        next.delete('t');

        if (mode === 'one-move-drill') {
            next.set('mode', 'one_move');
            next.delete('id');
        } else {
            next.delete('mode');
        }

        if (openingId) next.set('opening_id', openingId);
        else next.delete('opening_id');

        if (variationId && mode !== 'one-move-drill') next.set('id', variationId);
        else next.delete('id');

        next.set('t', String(Date.now()));
        setSearchParams(next);
        setShowEntry(false);
    };

    const handleArenaReviewMistake = (mistakeId: string) => {
        if (isGuestUser) {
            handleArenaSignUp();
            return;
        }
        const next = new URLSearchParams(searchParams);
        next.delete('opening_id');
        next.delete('id');
        next.delete('mode');
        next.set('mistake_id', mistakeId);
        next.set('t', String(Date.now()));
        setSearchParams(next);
        setShowEntry(false);
    };

    const handleArenaDismissMistake = async (mistakeId: string) => {
        if (isGuestUser) {
            handleArenaSignUp();
            return;
        }
        const parsed = Number(mistakeId);
        if (!Number.isFinite(parsed)) return;
        try {
            await api.submitResult({ type: 'mistake_fixed', mistake_id: parsed, hint_used: true });
            setMistakes((prev) => prev.filter((m) => m.id !== mistakeId));
            if (!isGuestUser) refreshUser();
        } catch (e) {
            console.error(e);
        }
    };

    if (showEntry) {
        return (
            <TrainingArena
                openings={arenaOpenings}
                variations={arenaVariations}
                userProgress={[]}
                userMistakes={arenaUserMistakes}
                currentSession={null}
                userStats={arenaUserStats}
                isGuest={isGuestUser}
                isPremium={isPremiumUser}
                onStartSession={handleArenaStartSession}
                onReviewMistake={handleArenaReviewMistake}
                onDismissMistake={handleArenaDismissMistake}
                onStartFreeTrial={() => navigate('/pricing')}
                onSignUp={handleArenaSignUp}
                onToggleRepertoireOnly={(enabled) => {
                    didInitRepertoireOnlyRef.current = true;
                    setUseRepertoireOnly(enabled);
                    setParam('repertoire_only', enabled ? 'true' : null);
                }}
                onToggleWrongMoveMode={(enabled) => {
                    try {
                        localStorage.setItem('wrongMoveMode', enabled ? 'stay' : 'snap');
                        localStorage.setItem('trainingArena.wrongMoveMode', enabled ? 'true' : 'false');
                    } catch {
                        // ignore
                    }
                }}
                onChangeSideFilter={(side) => setParam('side', side)}
            />
        );
    }

    if (loading) return <div className="flex justify-center items-center h-64 text-slate-300">Loading session...</div>;

    const isPremiumLockedMessage = message === PREMIUM_LOCK_MESSAGE_KEY;

    if (!session) {
        return (
            <div className="text-center py-20">
                <h2 className="text-3xl font-semibold text-slate-900 dark:text-white mb-3">{isPremiumLockedMessage ? "This line is Premium" : (message || "All caught up!")}</h2>
                <p className="text-slate-600 dark:text-slate-400 mb-8">
                    {isPremiumLockedMessage
                        ? "Premium unlocks all lines, making training and drills far more effective."
                        : "Try adjusting your filters or come back later."}
                </p>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                    <button
                        onClick={fetchSession}
                        className="bg-indigo-500 text-white px-6 py-2 rounded-full hover:bg-indigo-400 transition shadow-lg shadow-indigo-900/30"
                    >
                        Check Again
                    </button>
                    {isPremiumLockedMessage && (
                        <button
                            onClick={() => navigate('/pricing')}
                            className="px-5 py-2 rounded-full border border-indigo-200 text-indigo-800 bg-indigo-50 hover:bg-indigo-100 font-semibold shadow-sm transition-colors dark:border-indigo-500/40 dark:text-indigo-100 dark:bg-indigo-500/15 dark:hover:bg-indigo-500/25"
                        >
                            Start free trial
                        </button>
                    )}
                </div>
            </div>
        );
    }

    const repertoireOnlyControl = !hasSpecificOpening ? (
        <div className="flex items-start gap-3 bg-white/85 border border-slate-200 rounded-xl p-3 shadow-sm dark:bg-slate-900/60 dark:border-slate-800">
            <input
                type="checkbox"
                id="use-repertoire-only"
                className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-indigo-500"
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
            <label htmlFor="use-repertoire-only" className={clsx("flex flex-col text-sm", !hasRepertoire && "text-slate-500")}>
                <span className="font-semibold text-slate-900 dark:text-slate-100">Use my repertoire only</span>
                <span className="text-xs text-slate-600 dark:text-slate-400">If enabled, recall uses only your repertoire openings for this side.</span>
                {!hasRepertoire && (
                    <span className="text-[11px] text-slate-500 mt-1">Add openings to your repertoire to enable this.</span>
                )}
            </label>
        </div>
    ) : null;

    return (
        <div
            className="w-full max-w-6xl mx-auto flex flex-col overflow-hidden"
            style={{ height: 'calc(100dvh - 6.5rem)' }} // 100dvh - (Header ~3.5rem + Padding ~3rem)
        >
            <GuestModeBanner isAuthenticated={!!user?.is_authenticated} isLoading={userLoading} />

            <div className="flex-1 min-h-0 bg-white/85 border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-lg shadow-slate-200/60 relative dark:bg-slate-900/70 dark:border-slate-800 dark:shadow-2xl dark:shadow-black/40 transition-colors duration-200 flex flex-col overflow-hidden">
                {completed && (
                    <div className="absolute top-0 left-0 right-0 z-20 flex justify-center p-2">
                        <div className="w-full max-w-2xl rounded-lg border border-emerald-400/60 bg-emerald-100/95 p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300 shadow-lg shadow-emerald-200/70 dark:bg-emerald-900/85 dark:border-emerald-500/60 dark:shadow-emerald-900/50">
                            <div className="flex items-center gap-3 text-emerald-800 dark:text-emerald-100">
                                <div className="w-8 h-8 bg-emerald-200 text-emerald-800 rounded-full flex items-center justify-center shrink-0 shadow-inner shadow-emerald-300/60 dark:bg-emerald-800/90 dark:text-emerald-100">
                                    <Trophy size={16} />
                                </div>
                                <div>
                                    <div className="font-semibold text-emerald-900 text-sm dark:text-emerald-50">Session Complete</div>
                                    <div className="text-xs font-medium text-emerald-800/90 dark:text-emerald-100/90">{message}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        setCompleted(false);
                                        setMessage(null);
                                        fetchSession();
                                    }}
                                    className="text-xs font-medium text-indigo-700 hover:text-indigo-900 px-3 py-1.5 hover:bg-indigo-100 rounded-md transition-colors dark:text-indigo-200 dark:hover:text-white dark:hover:bg-indigo-500/20"
                                >
                                    Try again
                                </button>
                                {isReviewMode ? (
                                    <button
                                        onClick={() => navigate('/openings')}
                                        className="inline-flex items-center gap-1 bg-indigo-500 text-white text-xs font-medium px-3 py-1.5 rounded-md hover:bg-indigo-400 transition shadow-lg shadow-indigo-900/40"
                                    >
                                        Train another opening <ArrowRight size={12} />
                                    </button>
                                ) : (
                                    <button
                                        onClick={fetchSession}
                                        className="inline-flex items-center gap-1 bg-indigo-500 text-white text-xs font-medium px-3 py-1.5 rounded-md hover:bg-indigo-400 transition shadow-lg shadow-indigo-900/40"
                                    >
                                        Next <ArrowRight size={12} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                <div className="flex-1 min-h-0">
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
                        lineOptions={displayedLineOptions.map(l => ({ id: l.id, label: l.label }))}
                        selectedLineId={displayedSelectedLineId}
                        onSelectLine={handleSelectLine}
                        headerMode="training"
                        hideLog={isOneMoveMode}
                        isOneMoveMode={isOneMoveMode}
                        sidebarFooter={repertoireOnlyControl}
                        fitToViewport={true}
                    />
                </div>
            </div>
        </div>
    );
};
