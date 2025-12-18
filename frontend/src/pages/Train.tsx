import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api/client';
import type { OpeningsResponse, OpeningDrillResponse, RecallSessionResponse, RecallSessionVariation } from '../types';
import type { MistakeListItem } from '../api/client';
import { GameArea, type GameAreaHandle } from '../components/GameArea';
import { useUser } from '../context/UserContext';
import { Chess } from 'chess.js';
import { TrainingArena } from '../components/TrainingArena/components';
import type {
    CurrentSession as ArenaCurrentSession,
    Difficulty as ArenaDifficulty,
    Side as ArenaSide,
    TrainingMode as ArenaTrainingMode,
} from '../components/TrainingArena/types';

type OneMovePuzzleSession = Omit<RecallSessionVariation, 'type'> & {
    type: 'mistake'
    fen: string
    correct_move: string
    variation_name: string
}

export const Train: React.FC = () => {
    const { user, refreshUser } = useUser();
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
    const [openingDrillSession, setOpeningDrillSession] = useState<OpeningDrillResponse | null>(null);
    const [arenaProgress, setArenaProgress] = useState<{ movesPlayed: number; totalMoves: number }>({
        movesPlayed: 0,
        totalMoves: 0,
    });
    const [arenaHintsUsed, setArenaHintsUsed] = useState(0);
    const [arenaStartedAt, setArenaStartedAt] = useState(() => new Date().toISOString());
    const gameAreaRef = useRef<GameAreaHandle | null>(null);

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
    const isOneMoveMode = searchParams.get('mode') === 'one_move';
    const isOpeningDrillMode = searchParams.get('mode') === 'opening_drill';

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

    const currentOpening = openings.find(o => o.slug === (openingFilter || selectedOpening)) || openings.find(o => o.slug === selectedOpening);

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
        setArenaProgress({ movesPlayed: 0, totalMoves: 0 });
        setArenaHintsUsed(0);
        setArenaStartedAt(new Date().toISOString());
        setCompleted(false);
        setMessage(null);
        try {
            setStaminaExhausted(false);
            setOpeningDrillSession(null);

            if (isOpeningDrillMode) {
                const openingId = openingFilter || selectedOpening || undefined;
                if (!openingId) {
                    setMessage("Select an opening to start Opening Drill.");
                    return;
                }
                const data = await api.getOpeningDrillSession(openingId);
                setOpeningDrillSession(data);
                setSession(null);
                setSelectedOpening(openingId);
                setSelectedVariation(data.variation.id);
                return;
            }

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
        } catch (err: unknown) {
            console.error("Failed to fetch session", err);
            const response = (() => {
                if (typeof err !== 'object' || err === null) return undefined;
                if (!('response' in err)) return undefined;
                return (err as { response?: { status?: number; data?: unknown } }).response;
            })();
            const status = response?.status;
            const msg = (() => {
                const data = response?.data;
                if (typeof data !== 'object' || data === null) return undefined;
                const record = data as { error?: unknown; message?: unknown };
                const value = record.error ?? record.message;
                return typeof value === 'string' ? value : undefined;
            })();

            if (status === 403) {
                if (msg && (msg.includes("stamina") || msg.includes("limit"))) {
                    setMessage("You are out of stamina for today! Come back tomorrow.");
                    setStaminaExhausted(true);
                } else if (msg && (msg.includes("locked") || msg.includes("premium"))) {
                    setMessage(PREMIUM_LOCK_MESSAGE_KEY);
                } else {
                    setMessage("Access denied. Please check your account status.");
                }
            } else if (status === 404) {
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
        isOpeningDrillMode,
        selectedOpening,
        fetchOneMoveSession,
        fetchSpecificOpeningSession,
    ]);

    useEffect(() => {
        if (showEntry) return;
        fetchSession();
    }, [fetchSession, showEntry]);

    const handleComplete = async (success: boolean, hintUsed: boolean) => {
        const isGuest = !user || !user.is_authenticated;

        if (isOpeningDrillMode) {
            if (!openingDrillSession) return;
            setCompleted(true);
            try {
                await api.submitResult({
                    type: 'variation_complete',
                    id: openingDrillSession.variation.id,
                    hint_used: hintUsed,
                    mode: 'opening_drill',
                });
                if (!isGuest) refreshUser();
                setMessage(hintUsed ? 'Line completed (with hint).' : 'Line completed!');
            } catch (err) {
                console.error(err);
            }
            return;
        }

        if (!session) return;

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
        const isGuest = !user || !user.is_authenticated;

        if (isOpeningDrillMode) {
            if (!openingDrillSession) return;
            try {
                await api.submitResult({
                    type: 'blunder_made',
                    id: openingDrillSession.variation.id,
                    fen,
                    wrong_move: wrongMove,
                    correct_move: correctMove,
                    mode: 'opening_drill',
                });
                if (!isGuest) {
                    void refreshMistakes();
                }
            } catch (err) {
                console.error(err);
            }
            return;
        }

        if (!session) return;
        if (session.type === 'mistake') return; // Don't double count mistakes in mistake mode

        // One Move Drill: Handle mistake and next
        if (isOneMoveMode) {
            try {
                // Log mistake
                await api.submitResult({
                    type: 'blunder_made',
                    id: session.id,
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
                id: session.id,
                fen,
                wrong_move: wrongMove,
                correct_move: correctMove
            });
            if (!isGuest) {
                void refreshMistakes();
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Blocking check removed to allow Guest Training
    // if (!user || !user.is_authenticated) { ... }

    const oneMoveSession = useMemo<OneMovePuzzleSession | null>(() => {
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
                type: 'mistake', // Treat as single-move puzzle
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

    const activeSession: RecallSessionResponse | OneMovePuzzleSession | null = isOneMoveMode && oneMoveSession ? oneMoveSession : session;

    const handleArenaSignUp = () => {
        navigate('/signup', { state: { backgroundLocation: location } });
    };

    const setParam = (key: string, value: string | null) => {
        const next = new URLSearchParams(searchParams);
        if (value === null || value === '') next.delete(key);
        else next.set(key, value);
        setSearchParams(next);
    };

    const handleArenaRequestHint = () => {
        setArenaHintsUsed((prev) => prev + 1);
        gameAreaRef.current?.requestHint();
    };

    const handleArenaResetPosition = () => {
        setArenaHintsUsed(0);
        setCompleted(false);
        gameAreaRef.current?.resetPosition();
    };

    const handleArenaStepBack = () => {
        gameAreaRef.current?.stepBack();
    };

    const handleArenaStepForward = () => {
        gameAreaRef.current?.stepForward();
    };

    const handleRemainingMovesChange = useCallback((remaining: number, total: number) => {
        setArenaProgress((prev) => {
            const movesPlayed = Math.max(0, total - remaining);
            if (prev.movesPlayed === movesPlayed && prev.totalMoves === total) return prev;
            return { movesPlayed, totalMoves: total };
        });
    }, []);

    const handleArenaSwitchMode = (mode: ArenaTrainingMode) => {
        const next = new URLSearchParams(searchParams);
        next.delete('mistake_id');
        next.delete('t');

        if (mode === 'one-move-drill') {
            next.set('mode', 'one_move');
            next.delete('id');
        } else if (mode === 'opening-drill') {
            next.set('mode', 'opening_drill');
            next.delete('id');
        } else {
            next.delete('mode');
        }

        next.set('t', String(Date.now()));
        setSearchParams(next);
        setShowEntry(false);
    };

    const handleArenaSelectOpening = (openingId: string) => {
        const next = new URLSearchParams(searchParams);
        next.delete('mistake_id');
        next.set('opening_id', openingId);
        next.delete('id');
        next.set('t', String(Date.now()));
        setSearchParams(next);
        setShowEntry(false);
    };

    const handleArenaSelectVariation = (variationId: string) => {
        if (isOneMoveMode || isOpeningDrillMode) {
            setSelectedVariation(variationId);
            return;
        }
        const next = new URLSearchParams(searchParams);
        next.delete('mistake_id');
        next.set('id', variationId);
        next.set('t', String(Date.now()));
        setSearchParams(next);
        setShowEntry(false);
    };

    const handleArenaStartSession = (mode: 'opening-training' | 'one-move-drill' | 'opening-drill', openingId?: string, variationId?: string) => {
        const next = new URLSearchParams(searchParams);
        next.delete('mistake_id');
        next.delete('t');

        if (mode === 'one-move-drill') {
            next.set('mode', 'one_move');
            next.delete('id');
        } else if (mode === 'opening-drill') {
            next.set('mode', 'opening_drill');
            next.delete('id');
        } else {
            next.delete('mode');
        }

        if (openingId) next.set('opening_id', openingId);
        else next.delete('opening_id');

        if (variationId && mode !== 'one-move-drill' && mode !== 'opening-drill') next.set('id', variationId);
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

    const handleArenaDismissMistake = (mistakeId: string) => {
        setMistakes((prev) => prev.filter((m) => m.id !== mistakeId));
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

    const arenaMode: ArenaTrainingMode = isOpeningDrillMode
        ? 'opening-drill'
        : isOneMoveMode
            ? 'one-move-drill'
            : 'opening-training';

    const wrongMoveModeEnabled = (() => {
        try {
            return localStorage.getItem('trainingArena.wrongMoveMode') === 'true';
        } catch {
            return false;
        }
    })();

    const openingsForArena = arenaOpenings.slice();
    const variationsForArena = arenaVariations.slice();

    let openingId = openingFilter || selectedOpening || openingsForArena[0]?.id || '';
    let variationId = selectedVariation || variationsForArena.find(v => v.openingId === openingId)?.id || variationsForArena[0]?.id || '';

    if (isOpeningDrillMode && openingDrillSession) {
        openingId = openingFilter || selectedOpening || openingId;
        variationId = openingDrillSession.variation.id;
    }

    if (!isOpeningDrillMode && activeSession) {
        if (activeSession.opening?.slug) {
            openingId = activeSession.opening.slug;
        }

        if (activeSession.type !== 'mistake') {
            variationId = activeSession.id;
        } else {
            const syntheticOpeningId = openingId || 'unknown-opening';
            if (!openingsForArena.some(o => o.id === syntheticOpeningId)) {
                openingsForArena.push({
                    id: syntheticOpeningId,
                    name: activeSession.opening?.name ?? 'Unknown opening',
                    description: '',
                    side: 'white',
                    eco: '',
                    imageUrl: '',
                    variationCount: 0,
                    isPremium: false,
                });
            }
            openingId = syntheticOpeningId;
            variationId = `mistake-${activeSession.id}`;
            if (!variationsForArena.some(v => v.id === variationId)) {
                variationsForArena.push({
                    id: variationId,
                    openingId: syntheticOpeningId,
                    name: activeSession.variation_name || 'Mistake',
                    description: '',
                    moves: '',
                    moveCount: 1,
                    difficulty: 'beginner',
                    isPremium: false,
                    isLocked: false,
                    isInRepertoire: false,
                });
            }
        }
    }

    const hasActiveSession = isOpeningDrillMode ? !!openingDrillSession : !!activeSession;
    if (!hasActiveSession) {
        return (
            <div className="text-center py-20">
                <h2 className="text-3xl font-semibold text-slate-900 dark:text-white mb-3">
                    {message || 'No training available right now.'}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-8">
                    Try adjusting filters, or start a new session from Training Arena.
                </p>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                    <button
                        onClick={() => {
                            const next = new URLSearchParams(searchParams);
                            next.delete('mistake_id');
                            next.delete('id');
                            next.delete('t');
                            next.delete('mode');
                            setSearchParams(next);
                            setShowEntry(true);
                        }}
                        className="bg-emerald-600 text-white px-6 py-2 rounded-full hover:bg-emerald-700 transition shadow-sm"
                        type="button"
                    >
                        Back to Training Arena
                    </button>
                    <button
                        onClick={fetchSession}
                        className="bg-slate-900 text-white px-6 py-2 rounded-full hover:bg-slate-800 transition shadow-sm dark:bg-slate-800 dark:hover:bg-slate-700"
                        type="button"
                    >
                        Check Again
                    </button>
                </div>
            </div>
        );
    }

    const fallbackTotalMoves = (() => {
        if (arenaProgress.totalMoves > 0) return arenaProgress.totalMoves;
        if (isOpeningDrillMode && openingDrillSession) return openingDrillSession.variation.moves.length;
        if (!isOpeningDrillMode && activeSession && activeSession.type !== 'mistake') return activeSession.moves.length;
        return 1;
    })();

    const arenaCurrentSession: ArenaCurrentSession = {
        mode: arenaMode,
        openingId,
        variationId,
        movesPlayed: arenaProgress.movesPlayed,
        totalMoves: fallbackTotalMoves,
        hintsUsed: arenaHintsUsed,
        isComplete: !isOneMoveMode && completed,
        startedAt: arenaStartedAt,
        filters: {
            repertoireOnly: useRepertoireOnly,
            wrongMoveMode: wrongMoveModeEnabled,
            side: sideParam,
        },
    };

    const sessionBoard = (
        <GameArea
            ref={gameAreaRef}
            mode={isOpeningDrillMode ? 'sequence' : (activeSession?.type === 'mistake' ? 'mistake' : 'sequence')}
            sessionTitle={
                isOpeningDrillMode
                    ? (openingDrillSession?.opening.name ?? 'Opening Drill')
                    : (activeSession?.type === 'mistake' ? activeSession.variation_name : activeSession?.name)
            }
            sessionType={isOpeningDrillMode ? 'opening_drill' : activeSession?.type}
            initialFen={!isOpeningDrillMode && activeSession?.type === 'mistake' ? activeSession.fen : undefined}
            targetNextMove={!isOpeningDrillMode && activeSession?.type === 'mistake' ? activeSession.correct_move : undefined}
            targetMoves={
                isOpeningDrillMode
                    ? openingDrillSession?.variation.moves
                    : (activeSession && activeSession.type !== 'mistake' ? activeSession.moves : undefined)
            }
            orientation={isOpeningDrillMode ? openingDrillSession?.variation.orientation : activeSession?.orientation}
            onComplete={handleComplete}
            onMistake={handleMistake}
            locked={!isOneMoveMode && completed}
            headerMode={isOpeningDrillMode ? 'drill' : 'training'}
            showInlineProgress={false}
            hideLog={true}
            isOneMoveMode={isOneMoveMode}
            layout="embedded"
            fitToViewport={false}
            onRemainingMovesChange={handleRemainingMovesChange}
        />
    );

    return (
        <TrainingArena
            openings={openingsForArena}
            variations={variationsForArena}
            userProgress={[]}
            userMistakes={arenaUserMistakes}
            currentSession={arenaCurrentSession}
            userStats={arenaUserStats}
            isGuest={isGuestUser}
            isPremium={isPremiumUser}
            sessionBoard={sessionBoard}
            onRequestHint={handleArenaRequestHint}
            onResetPosition={handleArenaResetPosition}
            onStepBack={handleArenaStepBack}
            onStepForward={handleArenaStepForward}
            onNextSession={() => {
                setCompleted(false);
                fetchSession();
            }}
            onRetrySession={() => {
                setCompleted(false);
                setArenaHintsUsed(0);
                gameAreaRef.current?.resetPosition();
            }}
            onSelectOpening={handleArenaSelectOpening}
            onSelectVariation={handleArenaSelectVariation}
            onSwitchMode={handleArenaSwitchMode}
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
            onStartFreeTrial={() => navigate('/pricing')}
            onSignUp={handleArenaSignUp}
        />
    );
};
