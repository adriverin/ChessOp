import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Chess } from 'chess.js';
import { Chessground } from 'chessground';
import type { Move as APIMove } from '../types';
import { RotateCcw, CheckCircle, XCircle, HelpCircle, Brain, ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import confetti from 'canvas-confetti';
import { PIECE_IMAGES } from './ChessPieceImages';
import 'chessground/assets/chessground.base.css';
import 'chessground/assets/chessground.brown.css';
import 'chessground/assets/chessground.cburnett.css';

interface GameAreaProps {
    initialFen?: string;
    orientation?: 'white' | 'black';
    targetMoves?: APIMove[];
    targetNextMove?: string;
    onComplete: (success: boolean, hintsUsed: boolean) => void;
    onMistake: (fen: string, wrongMove: string, correctMove: string) => void;
    mode: 'mistake' | 'sequence';
    locked?: boolean;
    sessionTitle?: string;
    sessionType?: string;
    opening?: { slug: string; name: string };
    openingOptions?: { slug: string; name: string }[];
    onSelectOpening?: (slug: string) => void;
    showInlineProgress?: boolean;
    onRemainingMovesChange?: (remaining: number, total: number) => void;
    lineOptions?: { id: string; label: string }[];
    selectedLineId?: string;
    onSelectLine?: (id: string) => void;
    headerMode?: 'drill' | 'training';
    hideLog?: boolean;
    isOneMoveMode?: boolean;
    sidebarFooter?: React.ReactNode;
    fitToViewport?: boolean;
}

export const GameArea: React.FC<GameAreaProps> = ({
    initialFen,
    orientation = 'white',
    targetMoves,
    targetNextMove,
    onComplete,
    onMistake,
    mode,
    locked = false,
    sessionTitle,
    opening,
    openingOptions,
    onSelectOpening,
    showInlineProgress = true,
    onRemainingMovesChange,
    lineOptions,
    selectedLineId,
    onSelectLine,
    headerMode = 'training',
    hideLog = false,
    isOneMoveMode = false,
    sidebarFooter,
    fitToViewport = false
}) => {
    const [game, setGame] = useState(() => {
        try {
            if (!initialFen || initialFen === 'start') return new Chess();
            if (initialFen.split(' ').length !== 6) return new Chess();
            return new Chess(initialFen);
        } catch (e) {
            return new Chess();
        }
    });
    const [moveIndex, setMoveIndex] = useState(0);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [hint, setHint] = useState<string | null>(null);
    const [hintsUsed, setHintsUsed] = useState(false);
    const [hasMistakeInLine, setHasMistakeInLine] = useState(false);
    const [wrongMoveView, setWrongMoveView] = useState<{ fen: string; lastMove?: [string, string] } | null>(null);
    const [maxPlayedIndex, setMaxPlayedIndex] = useState(0);
    const [isMovesExpanded, setIsMovesExpanded] = useState(false);
    const [wrongMoveMode, setWrongMoveMode] = useState<'snap' | 'stay'>(() => {
        const saved = typeof window !== 'undefined' ? localStorage.getItem('wrongMoveMode') : null;
        return saved === 'stay' ? 'stay' : 'snap';
    });
    const [logRevealed, setLogRevealed] = useState(false);
    const [openingPickerOpen, setOpeningPickerOpen] = useState(false);
    const [linePickerOpen, setLinePickerOpen] = useState(false);

    // Audio sounds
    // NOTE: move.mp3, success.mp3, error.mp3, and capture.mp3
    // must be real audio files in public/sounds/. Repo placeholders are empty; replace with actual assets.
    const moveSound = useMemo(() => new Audio('/sounds/move.mp3'), []);
    const successSound = useMemo(() => new Audio('/sounds/success.mp3'), []);
    const errorSound = useMemo(() => new Audio('/sounds/error.mp3'), []);
    const captureSound = useMemo(() => new Audio('/sounds/capture.mp3'), []);

    const playSound = (audio: HTMLAudioElement) => {
        try {
            audio.currentTime = 0;
            audio.play().catch(e => console.warn("Audio play failed", e));
        } catch (e) {
            console.warn("Audio error", e);
        }
    };

    const playMoveSound = (moveInfo: { captured?: boolean; san?: string }) => {
        const isCapture = Boolean(moveInfo?.captured) || (moveInfo?.san ? moveInfo.san.includes('x') : false);
        const sound = isCapture ? captureSound : moveSound;
        playSound(sound);
    };

    const activeMoveRef = useRef<HTMLDivElement>(null);
    const logContainerRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const groundRef = useRef<any>(null);

    useEffect(() => {
        if (activeMoveRef.current && logContainerRef.current) {
            const container = logContainerRef.current;
            const element = activeMoveRef.current;

            // Only scroll if element is not fully visible or to center it
            const relativeTop = element.offsetTop - container.offsetTop;
            const halfContainer = container.clientHeight / 2;
            const halfElement = element.clientHeight / 2;

            container.scrollTo({
                top: relativeTop - halfContainer + halfElement,
                behavior: 'smooth'
            });
        }
    }, [moveIndex, logRevealed]);

    const getSquareCoords = (square: string, orientation: 'white' | 'black') => {
        const file = square.charCodeAt(0) - 97; // a=0
        const rank = parseInt(square[1]) - 1;   // 1=0

        const x = orientation === 'white' ? file : 7 - file;
        const y = orientation === 'white' ? 7 - rank : rank;

        return { x, y };
    };

    // Calculate legal moves for Chessground
    const toDests = (chess: Chess) => {
        const dests = new Map();
        chess.moves({ verbose: true }).forEach((m: any) => {
            if (!dests.has(m.from)) dests.set(m.from, []);
            dests.get(m.from).push(m.to);
        });
        return dests;
    };

    // Initialize/Update Chessground
    useEffect(() => {
        if (!containerRef.current) return;

        const isLocked = locked;
        const isWrongMoveStay = wrongMoveView && wrongMoveMode === 'stay';

        const config = {
            fen: wrongMoveView ? wrongMoveView.fen : game.fen(),
            orientation: orientation,
            viewOnly: isLocked, // Allow interaction if wrong move (to click/revert)
            turnColor: game.turn() === 'w' ? 'white' : 'black',
            animation: {
                enabled: true,
                duration: 200
            },
            movable: (isLocked || isWrongMoveStay) ? {
                free: false,
                color: orientation,
                dests: new Map(), // no moves allowed
                showDests: false,
                rookCastle: false,
            } : {
                free: false,
                color: orientation, // Only allow moving pieces for the player's color
                dests: toDests(game),
                showDests: true,
                rookCastle: true,
                events: {
                    after: (orig: string, dest: string) => {
                        handleMove(orig, dest);
                    }
                }
            },
            events: {
                select: (key: string) => {
                    if (isWrongMoveStay && wrongMoveView?.lastMove) {
                        const [_, target] = wrongMoveView.lastMove;
                        if (key === target) {
                            handleRevertWrong();
                        }
                    }
                }
            },
            premovable: {
                enabled: false
            },
            draggable: {
                enabled: !isLocked
            },
            selectable: {
                enabled: !isLocked
            }
        };

        if (!groundRef.current) {
            // @ts-ignore
            groundRef.current = Chessground(containerRef.current, config);
        } else {
            groundRef.current.set(config);
        }

        // Cleanup
        return () => {
            // Chessground ref cleanup if needed
        };
    }, [game, orientation, locked, wrongMoveView]);

    useEffect(() => {
        if (moveIndex > maxPlayedIndex) {
            setMaxPlayedIndex(moveIndex);
        }
    }, [moveIndex, maxPlayedIndex]);

    // Handle Move Logic
    const handleMove = (source: string, target: string) => {
        if (wrongMoveView) {
            // While wrong move is displayed in stay mode, ignore further moves until reverted
            return;
        }
        const gameCopy = new Chess(game.fen());
        try {
            const result = gameCopy.move({
                from: source,
                to: target,
                promotion: 'q'
            });

            if (!result) return;

            const fenBeforeMove = game.fen();
            const playedSan = result.san;

            let isCorrect = false;
            let expectedMove = '';

            if (mode === 'mistake') {
                expectedMove = targetNextMove || '';
                isCorrect = playedSan === expectedMove;
            } else if (mode === 'sequence' && targetMoves) {
                expectedMove = targetMoves[moveIndex]?.san || '';
                isCorrect = playedSan === expectedMove;
            }

            if (isCorrect) {
                setGame(gameCopy);
                setFeedback('correct');
                setHint(null);
                playMoveSound({ captured: !!result.captured, san: result.san });

                // Handle Progression
                if (mode === 'mistake') {
                    setTimeout(() => onComplete(true, hintsUsed), 500);
                } else if (mode === 'sequence' && targetMoves) {
                    const nextIndex = moveIndex + 1;
                    if (nextIndex >= targetMoves.length) {
                        setTimeout(() => onComplete(true, hintsUsed), 500);
                    } else {
                        setMoveIndex(nextIndex);

                        // Opponent Auto-play logic
                        const isWhiteTurn = gameCopy.turn() === 'w';
                        const userPlaysWhite = orientation === 'white';

                        if (isWhiteTurn !== userPlaysWhite) {
                            setTimeout(() => {
                                const nextMove = targetMoves[nextIndex];
                                if (nextMove) {
                                    const g2 = new Chess(gameCopy.fen());
                                    const autoRes = g2.move(nextMove.san);
                                    if (autoRes) {
                                        setGame(g2);
                                        playMoveSound({ captured: !!autoRes.captured, san: autoRes.san });
                                        setMoveIndex(nextIndex + 1);
                                        setFeedback(null);
                                        if (nextIndex + 1 >= targetMoves.length) {
                                            setTimeout(() => onComplete(true, hintsUsed), 500);
                                        }
                                    }
                                }
                            }, 500);
                        }
                    }
                }
            } else {
                // Wrong move
                setFeedback('wrong');
                setHasMistakeInLine(true);
                playSound(errorSound);
                onMistake(fenBeforeMove, playedSan, expectedMove);

                if (isOneMoveMode) {
                    // One Move Mode: Do not show wrong move view, do not snap back (wait for parent reset)
                    // The parent component should immediately replace the session.
                    return;
                }

                if (wrongMoveMode === 'stay') {
                    // Show wrong position and wait for user to revert
                    setWrongMoveView({
                        fen: gameCopy.fen(),
                        lastMove: [source, target]
                    });
                } else {
                    // Snap back
                    setTimeout(() => {
                        if (groundRef.current) {
                            groundRef.current.set({
                                fen: game.fen(),
                                turnColor: game.turn() === 'w' ? 'white' : 'black',
                                lastMove: undefined,
                                movable: {
                                    color: orientation,
                                    dests: toDests(game),
                                    showDests: true,
                                    rookCastle: true,
                                }
                            });
                        }
                        setTimeout(() => setFeedback(null), 1500);
                    }, 400);
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Initial Auto-play Effect
    useEffect(() => {
        const safeChess = (fen?: string) => {
            try {
                return new Chess(fen || undefined);
            } catch (e) { return new Chess(); }
        };

        const newGame = safeChess(initialFen);
        setGame(newGame);
        setMoveIndex(0);
        setMaxPlayedIndex(0);
        setFeedback(null);
        setHint(null);
        setHintsUsed(false);
        setHasMistakeInLine(false);
        setWrongMoveView(null);
        setLogRevealed(false);
        setIsMovesExpanded(false);

        if (mode === 'sequence' && targetMoves && targetMoves.length > 0) {
            let currentGame = newGame;
            let currentIndex = 0;
            const userPlaysWhite = orientation === 'white';

            while (currentIndex < targetMoves.length) {
                const isWhiteTurn = currentGame.turn() === 'w';
                const isUserTurn = (userPlaysWhite && isWhiteTurn) || (!userPlaysWhite && !isWhiteTurn);

                if (isUserTurn) break;

                const move = targetMoves[currentIndex];
                try {
                    const result = currentGame.move(move.san);
                    if (result) currentIndex++;
                    else break;
                } catch (e) { break; }
            }

            if (currentIndex > 0) {
                setGame(new Chess(currentGame.fen()));
                setMoveIndex(currentIndex);
                setMaxPlayedIndex(currentIndex);
            }
        }
    }, [initialFen, targetMoves, targetNextMove, mode, orientation]);

    const initialTurn = useMemo(() => {
        const safeChess = (fen?: string) => {
            try {
                return new Chess(fen || undefined);
            } catch (e) {
                return new Chess();
            }
        };
        return safeChess(initialFen).turn();
    }, [initialFen]);

    // Derived helpers
    const userMoveIndices = useMemo(() => {
        if (mode !== 'sequence' || !targetMoves) return [];
        const userColor = orientation === 'white' ? 'w' : 'b';
        const startingTurn = initialTurn;
        const opposite = startingTurn === 'w' ? 'b' : 'w';
        return targetMoves
            .map((_, idx) => {
                const moveColor = idx % 2 === 0 ? startingTurn : opposite;
                return moveColor === userColor ? idx : null;
            })
            .filter((idx): idx is number => idx !== null);
    }, [mode, targetMoves, orientation, initialTurn]);

    const totalUserMoves = useMemo(() => {
        if (mode === 'mistake') return 1;
        if (mode !== 'sequence' || !targetMoves) return 0;
        return userMoveIndices.length;
    }, [mode, targetMoves, userMoveIndices]);

    const effectiveMovePointer = useMemo(() => {
        if (mode !== 'sequence' || !targetMoves) return 0;
        // Count the current move as "done" ONLY if it's the last move and marked correct.
        // For intermediate moves, moveIndex already advances past the completed move.
        const isLastMove = moveIndex === targetMoves.length - 1;
        const extra = (feedback === 'correct' && isLastMove) ? 1 : 0;
        return moveIndex + extra;
    }, [mode, targetMoves, moveIndex, feedback]);

    const userMovesCompleted = useMemo(() => {
        if (mode === 'mistake') return feedback === 'correct' ? 1 : 0;
        if (mode !== 'sequence' || !targetMoves) return 0;
        return userMoveIndices.filter(idx => idx < effectiveMovePointer).length;
    }, [mode, targetMoves, userMoveIndices, effectiveMovePointer, feedback]);

    const isLineCompleted = useMemo(() => {
        if (mode === 'mistake') return feedback === 'correct';
        if (mode !== 'sequence' || !targetMoves) return false;

        // Completed if we've advanced past all moves OR we are at the last move and just got it right
        return moveIndex >= targetMoves.length || (moveIndex === targetMoves.length - 1 && feedback === 'correct');
    }, [mode, targetMoves, moveIndex, feedback]);

    const statusLabel = useMemo(() => {
        if (locked || isLineCompleted) return "Line complete";
        if (logRevealed) return "Review mode";
        return "Your move";
    }, [locked, isLineCompleted, logRevealed]);

    // Play success sound on completion
    useEffect(() => {
        if (isLineCompleted) {
            playSound(successSound);

            // Trigger confetti on perfect run
            if (!hasMistakeInLine && !hintsUsed) {
                if (containerRef.current) {
                    const rect = containerRef.current.getBoundingClientRect();
                    // Calculate normalized coordinates (0-1) for origin
                    const x = (rect.left + rect.width / 2) / window.innerWidth;
                    const y = (rect.top + rect.height / 3) / window.innerHeight;

                    const myConfetti = confetti.create(undefined, { resize: true, useWorker: true });
                    myConfetti({
                        particleCount: 150,
                        spread: 70,
                        origin: { x, y },
                        disableForReducedMotion: true,
                        zIndex: 100 // Above board
                    });
                }
            }
        }
    }, [isLineCompleted, successSound, hasMistakeInLine, hintsUsed]);

    const remainingMoves = useMemo(() => {
        if (totalUserMoves === 0) return 0;
        const remaining = Math.max(totalUserMoves - userMovesCompleted, 0);
        return isLineCompleted ? 0 : remaining;
    }, [totalUserMoves, userMovesCompleted, isLineCompleted]);

    const progressPercent = useMemo(() => {
        if (totalUserMoves === 0) return 100;
        const pct = (Math.min(userMovesCompleted, totalUserMoves) / totalUserMoves) * 100;
        return isLineCompleted ? 100 : pct;
    }, [totalUserMoves, userMovesCompleted, isLineCompleted]);

    useEffect(() => {
        if (logRevealed) {
            setIsMovesExpanded(true);
        }
    }, [logRevealed]);

    useEffect(() => {
        if (onRemainingMovesChange) {
            onRemainingMovesChange(remainingMoves, totalUserMoves);
        }
    }, [remainingMoves, totalUserMoves, onRemainingMovesChange]);

    const { capturedWhite, capturedBlack } = useMemo(() => {
        const capturedW: string[] = [];
        const capturedB: string[] = [];

        let tempGame: Chess;
        try {
            if (!initialFen || initialFen === 'start') tempGame = new Chess();
            else if (initialFen.split(' ').length !== 6) tempGame = new Chess();
            else tempGame = new Chess(initialFen);
        } catch (e) {
            tempGame = new Chess();
        }

        const movesToReplay: string[] = [];

        if (mode === 'sequence' && targetMoves) {
            for (let i = 0; i < moveIndex; i++) {
                if (targetMoves[i]) {
                    movesToReplay.push(targetMoves[i].san);
                }
            }
        } else if (mode === 'mistake' && feedback === 'correct' && targetNextMove) {
            movesToReplay.push(targetNextMove);
        }

        for (const san of movesToReplay) {
            try {
                const move = tempGame.move(san);
                if (move && move.captured) {
                    if (move.color === 'w') {
                        capturedW.push(move.captured);
                    } else {
                        capturedB.push(move.captured);
                    }
                }
            } catch (e) {
                console.error("Error replaying move for captures:", san, e);
            }
        }

        return { capturedWhite: capturedW, capturedBlack: capturedB };
    }, [initialFen, mode, targetMoves, targetNextMove, moveIndex, feedback]);

    const pieceValues: Record<string, number> = {
        p: 1,
        n: 3,
        b: 3,
        r: 5,
        q: 9
    };

    const materialDiff = useMemo(() => {
        const sumPieces = (list: string[]) => list.reduce((acc, p) => acc + (pieceValues[p.toLowerCase()] || 0), 0);
        const wScore = sumPieces(capturedWhite);
        const bScore = sumPieces(capturedBlack);
        return wScore - bScore;
    }, [capturedWhite, capturedBlack]);

    const renderCaptured = (list: string[], label: string, pieceColor: 'w' | 'b', aheadBy?: number) => (
        <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
            <span className="font-semibold min-w-[80px] text-slate-900 dark:text-slate-200">{label}:</span>
            <div className="flex gap-1 flex-wrap items-center">
                {list.length === 0 && <span className="text-slate-400 italic dark:text-slate-500">None</span>}
                {list.map((p, idx) => (
                    <span
                        key={idx}
                        className="inline-flex items-center justify-center rounded"
                    >
                        <img
                            src={PIECE_IMAGES[pieceColor + p.toLowerCase()] || ''}
                            alt={p}
                            className={clsx(
                                "w-6 h-6 select-none drop-shadow-sm drop-shadow-[0_1px_4px_rgba(0,0,0,0.25)] dark:drop-shadow-[0_1px_6px_rgba(0,0,0,0.4)]"
                            )}
                        />
                    </span>
                ))}
            </div>
            {aheadBy && aheadBy > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 font-semibold border border-emerald-400/30">
                    +{aheadBy}
                </span>
            )}
        </div>
    );

    const visibleMoves = useMemo(() => {
        if (!targetMoves) return [] as { move: APIMove; originalIndex: number }[];

        const total = targetMoves.length;
        if (isMovesExpanded || logRevealed) {
            return targetMoves.map((mv, idx) => ({ move: mv, originalIndex: idx }));
        }

        const end = Math.min(moveIndex + 1, total);
        // Show all history up to current move to allow scrolling
        // Do not slice the start

        return targetMoves.slice(0, end).map((mv, idx) => ({ move: mv, originalIndex: idx }));
    }, [targetMoves, isMovesExpanded, logRevealed, moveIndex]);

    const hasHiddenMoves = useMemo(() => {
        if (!targetMoves) return false;
        return visibleMoves.length < targetMoves.length;
    }, [targetMoves, visibleMoves]);

    const renderMoveLogContent = () => (
        <div
            ref={logContainerRef}
            className="flex-1 min-h-0 overflow-auto space-y-1 text-xs pr-1 p-2"
        >
            {visibleMoves.map(({ move: mv, originalIndex }) => {
                const isCurrent = originalIndex === moveIndex;
                const isPast = originalIndex < moveIndex;
                const shouldBlur = !logRevealed && !isPast;
                const isBlackMove = originalIndex % 2 === 1;

                // De-emphasize older moves (more than 3 moves ago)
                const isRecent = moveIndex - originalIndex <= 3;
                const isOldHistory = !logRevealed && isPast && !isRecent;

                return (
                    <div
                        key={originalIndex}
                        ref={isCurrent ? activeMoveRef : null}
                        className={clsx(
                            "flex items-start gap-2 px-2 py-1 rounded border transition-all",
                            isCurrent
                                ? "bg-indigo-100 text-slate-900 border-indigo-200 ring-1 ring-indigo-200 dark:bg-indigo-500/15 dark:text-slate-100 dark:border-indigo-400/30 dark:ring-indigo-500/30"
                                : "border-slate-200 ring-1 ring-white/5 dark:border-white/10",
                            !isCurrent && isBlackMove
                                ? "bg-slate-200/80 text-slate-900 dark:bg-white/6 dark:text-slate-100"
                                : (!isCurrent && "bg-indigo-50/90 text-slate-800 dark:bg-white/12 dark:text-slate-100"),
                            shouldBlur ? "opacity-50" : "",
                            isOldHistory ? "opacity-40 grayscale blur-[0.5px]" : ""
                        )}
                    >
                        <span className="text-[11px] text-slate-500 font-mono w-5 text-right pt-0.5 dark:text-slate-400">{originalIndex + 1}.</span>

                        <div className="flex flex-col w-full">
                            <div className="flex items-center gap-2">
                                <span className={clsx(
                                    "font-bold text-sm",
                                    shouldBlur ? "blur-md select-none text-transparent bg-slate-700 rounded w-6 h-4 inline-block" : (
                                        isBlackMove ? "text-slate-800 dark:text-slate-100" : "text-indigo-800 dark:text-indigo-100"
                                    )
                                )}>
                                    {shouldBlur ? "???" : mv.san}
                                </span>
                                {!shouldBlur && (
                                    <span className={clsx(
                                        "text-[9px] px-1 py-0.5 rounded-full font-bold tracking-wide uppercase",
                                        isBlackMove
                                            ? "bg-slate-200 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700"
                                            : "bg-indigo-100 text-indigo-800 border border-indigo-200 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                                    )}>
                                        {isBlackMove ? "Black" : "White"}
                                    </span>
                                )}
                            </div>
                            <span className={clsx(
                                "text-[11px] text-slate-600 mt-0.5 leading-snug dark:text-slate-300",
                                shouldBlur ? "blur-sm select-none opacity-40" : "font-medium"
                            )}>
                                {mv.desc}
                            </span>
                        </div>
                    </div>
                );
            })}
            {!logRevealed && hasHiddenMoves && (
                <div className="text-[10px] text-slate-400 text-center pt-1 border-t border-slate-100 dark:border-white/5 dark:text-slate-500">
                    Showing recent moves. Reveal all to view the full line.
                </div>
            )}
        </div>
    );

    const handleRevertWrong = () => {
        setWrongMoveView(null);
        setFeedback(null);
        if (groundRef.current) {
            groundRef.current.set({
                fen: game.fen(),
                turnColor: game.turn() === 'w' ? 'white' : 'black',
                lastMove: undefined,
                movable: {
                    free: false,
                    color: orientation,
                    dests: toDests(game),
                    showDests: true,
                    rookCastle: true,
                }
            });
        }
    };

    const jumpTo = (index: number) => {
        const safeChess = (fen?: string) => {
            try {
                return new Chess(fen || undefined);
            } catch (e) { return new Chess(); }
        };
        const newGame = safeChess(initialFen);

        let movesToPlay: string[] = [];
        if (mode === 'sequence' && targetMoves) {
            movesToPlay = targetMoves.slice(0, index).map(m => m.san);
        } else if (mode === 'mistake' && targetNextMove && index > 0) {
            movesToPlay = [targetNextMove];
        }

        for (const san of movesToPlay) {
            try {
                newGame.move(san);
            } catch (e) { break; }
        }

        setGame(newGame);
        setMoveIndex(index);
        setFeedback(null); // Clear feedback when navigating
        setWrongMoveView(null);
    };

    const boardWrapperRef = useRef<HTMLDivElement>(null);
    const [boardSize, setBoardSize] = useState<number>(0);

    useEffect(() => {
        if (!fitToViewport || !boardWrapperRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                // Leave a tiny buffer to avoid rounding jitters causing scrollbars
                const size = Math.floor(Math.min(width, height)) - 2;
                setBoardSize(Math.max(0, size));
            }
        });

        resizeObserver.observe(boardWrapperRef.current);
        return () => resizeObserver.disconnect();
    }, [fitToViewport]);

    return (
        <div className={clsx("flex flex-col lg:flex-row gap-4 justify-center items-stretch w-full", fitToViewport ? "h-full" : "")}>

            {/* Left Column: Board + Progress + Status */}
            <div className={clsx("flex flex-col w-full max-w-2xl gap-2", fitToViewport ? "min-h-0 flex-1" : "")}>
                {showInlineProgress && (
                    <div className="w-full shrink-0">
                        <div className="flex justify-between text-xs text-slate-400 mb-1 font-medium">
                            <span>Progress</span>
                            <span>{totalUserMoves === 0 ? '0 moves to play' : `${remainingMoves} moves remaining`}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-300 transition-all duration-500 ease-out"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-200/80 text-slate-700 font-semibold uppercase tracking-wide dark:bg-white/10 dark:text-slate-100">
                        {statusLabel}
                    </span>
                </div>

                {/* Board Container Wrapper */}
                {fitToViewport ? (
                    <div
                        ref={boardWrapperRef}
                        className="flex-1 min-h-0 w-full relative flex items-center justify-center"
                    >
                        {/* Actual Board - Sized via JS */}
                        <div
                            className="rounded-2xl overflow-hidden relative bg-slate-100 border border-slate-200 dark:bg-slate-900/70 dark:border-slate-800 transition-colors duration-200 shadow-md"
                            style={{ width: boardSize, height: boardSize }}
                        >
                            <div
                                ref={containerRef}
                                className="w-full h-full block"
                            />

                            {/* Wrong Move Indicator Overlay */}
                            {wrongMoveView && wrongMoveMode === 'stay' && wrongMoveView.lastMove && (() => {
                                const targetSquare = wrongMoveView.lastMove[1];
                                const { x, y } = getSquareCoords(targetSquare, orientation);
                                return (
                                    <div
                                        className="absolute pointer-events-none z-10"
                                        style={{
                                            left: `${x * 12.5}%`,
                                            top: `${y * 12.5}%`,
                                            width: '12.5%',
                                            height: '12.5%',
                                        }}
                                    >
                                        <div className="absolute top-0 right-0 w-3 h-3 bg-rose-500 rounded-full shadow-sm ring-1 ring-white/70 m-1" />
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                ) : (
                    /* Default / Drill Mode: Standard aspect-ratio sizing */
                    <div className="w-full aspect-square rounded-2xl overflow-hidden relative bg-slate-100 border border-slate-200 dark:bg-slate-900/70 dark:border-slate-800 transition-colors duration-200">
                        <div
                            ref={containerRef}
                            className="w-full h-full block"
                        />
                        {/* Wrong Move Indicator Overlay */}
                        {wrongMoveView && wrongMoveMode === 'stay' && wrongMoveView.lastMove && (() => {
                            const targetSquare = wrongMoveView.lastMove[1];
                            const { x, y } = getSquareCoords(targetSquare, orientation);
                            return (
                                <div
                                    className="absolute pointer-events-none z-10"
                                    style={{
                                        left: `${x * 12.5}%`,
                                        top: `${y * 12.5}%`,
                                        width: '12.5%',
                                        height: '12.5%',
                                    }}
                                >
                                    <div className="absolute top-0 right-0 w-3 h-3 bg-rose-500 rounded-full shadow-sm ring-1 ring-white/70 m-1" />
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* Status Bar */}
                <div className="bg-white rounded-xl shadow-md border border-slate-200 p-2 flex items-center justify-between w-full shrink-0 dark:bg-slate-900/80 dark:border-slate-800 dark:shadow-lg transition-colors duration-200">
                    <div className="flex items-center gap-3">
                        {feedback === 'correct' && <span className="text-emerald-600 font-bold flex items-center gap-1.5 text-sm dark:text-emerald-300"><CheckCircle size={18} /> Correct!</span>}
                        {feedback === 'wrong' && <span className="text-rose-500 font-bold flex items-center gap-1.5 text-sm dark:text-rose-300"><XCircle size={18} /> Incorrect</span>}
                        {!feedback && <span className="text-slate-500 italic text-sm font-medium dark:text-slate-400">Make your move...</span>}
                        {wrongMoveView && wrongMoveMode === 'stay' && (
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-xs rounded font-semibold border border-rose-200 dark:bg-rose-500/20 dark:text-rose-200 dark:border-rose-400/30">Wrong move</span>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                const mv = mode === 'mistake' ? targetNextMove : targetMoves?.[moveIndex]?.san;
                                setHint(mv || "No move available");
                                setHintsUsed(true);
                            }}
                            disabled={locked}
                            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 disabled:opacity-50 transition-colors"
                            title="Hint"
                        >
                            <HelpCircle size={18} />
                        </button>
                        <button
                            onClick={() => {
                                // Reset Logic
                                const safeChess = (fen?: string) => {
                                    try {
                                        return new Chess(fen || undefined);
                                    } catch (e) { return new Chess(); }
                                };
                                const newGame = safeChess(initialFen);
                                setGame(newGame);
                                setMoveIndex(0);
                                setMaxPlayedIndex(0);
                                setFeedback(null);
                                setHint(null);
                                setHintsUsed(false);
                                setHasMistakeInLine(false);
                                setWrongMoveView(null);
                                setLogRevealed(false);
                                setIsMovesExpanded(false);

                                if (mode === 'sequence' && targetMoves && targetMoves.length > 0) {
                                    let currentGame = newGame;
                                    let currentIndex = 0;
                                    const userPlaysWhite = orientation === 'white';
                                    while (currentIndex < targetMoves.length) {
                                        const isWhiteTurn = currentGame.turn() === 'w';
                                        const isUserTurn = (userPlaysWhite && isWhiteTurn) || (!userPlaysWhite && !isWhiteTurn);
                                        if (isUserTurn) break;
                                        try {
                                            if (currentGame.move(targetMoves[currentIndex].san)) currentIndex++;
                                            else break;
                                        } catch (e) { break; }
                                    }
                                    if (currentIndex > 0) {
                                        setGame(new Chess(currentGame.fen()));
                                        setMoveIndex(currentIndex);
                                        setMaxPlayedIndex(currentIndex);
                                    }
                                }

                                if (groundRef.current) {
                                    groundRef.current.set({
                                        fen: newGame.fen(),
                                        turnColor: newGame.turn() === 'w' ? 'white' : 'black',
                                        lastMove: undefined,
                                        movable: {
                                            free: false,
                                            color: orientation,
                                            dests: toDests(newGame),
                                            showDests: true,
                                            rookCastle: true,
                                        }
                                    });
                                }
                            }}
                            disabled={locked}
                            className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 disabled:opacity-50 transition-colors"
                            title="Reset Position"
                        >
                            <RotateCcw size={18} />
                        </button>

                        <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900/80 p-0.5">
                            <button
                                onClick={() => jumpTo(moveIndex - 1)}
                                disabled={moveIndex <= 0}
                                className="p-1.5 text-slate-400 hover:text-indigo-200 hover:bg-slate-800 rounded-md disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                                title="Step Back"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={() => jumpTo(moveIndex + 1)}
                                disabled={moveIndex >= maxPlayedIndex}
                                className="p-1.5 text-slate-400 hover:text-indigo-200 hover:bg-slate-800 rounded-md disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                                title="Step Forward"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {hint && <div className="text-sm text-indigo-100 bg-indigo-500/20 px-4 py-2 rounded-lg border border-indigo-500/30 text-center font-medium">Hint: {hint}</div>}
            </div>

            {/* Right Column: Sidebar */}
            <div className="relative flex flex-col w-full lg:w-[300px] shrink-0">
                {/* Wrapper to match height on desktop */}
                <div className="flex flex-col gap-2 lg:absolute lg:inset-0 lg:overflow-y-auto px-1">

                    {/* Session Info (Moved from Header) */}
                    <div className="bg-slate-900/70 p-2 rounded-xl border border-slate-800 shadow-lg shrink-0 relative">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-100 text-[10px] font-bold uppercase tracking-wide mb-1">
                            <Brain size={12} />
                            {headerMode === 'drill' ? "Spaced Repetition Training" : "Opening Training"}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3 flex-wrap">
                                {opening && openingOptions && openingOptions.length > 0 && onSelectOpening ? (
                                    <div className="relative">
                                        <button
                                            onClick={() => {
                                                setOpeningPickerOpen(prev => !prev);
                                                setLinePickerOpen(false);
                                            }}
                                            className="text-sm font-semibold text-slate-100 leading-snug hover:text-indigo-200 transition-colors"
                                            title="Switch opening"
                                        >
                                            {opening.name}
                                        </button>
                                        {openingPickerOpen && (
                                            <div className="absolute right-0 z-20 mt-1 w-56 max-h-56 overflow-auto bg-slate-900 border border-slate-800 rounded-lg shadow-xl p-1">
                                                {openingOptions.map(opt => (
                                                    <button
                                                        key={opt.slug}
                                                        onClick={() => {
                                                            setOpeningPickerOpen(false);
                                                            if (opt.slug !== opening.slug) {
                                                                onSelectOpening(opt.slug);
                                                            }
                                                        }}
                                                        className="w-full text-left px-2 py-1.5 rounded-md text-sm text-slate-100 hover:bg-indigo-500/10 transition-colors"
                                                    >
                                                        {opt.name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <h3 className="text-sm font-semibold text-slate-100 leading-snug">
                                        {sessionTitle}
                                    </h3>
                                )}

                                {headerMode === 'training' && lineOptions && lineOptions.length > 0 && onSelectLine && (
                                    <div className="relative">
                                        <button
                                            onClick={() => {
                                                setLinePickerOpen(prev => !prev);
                                                setOpeningPickerOpen(false);
                                            }}
                                            className="text-xs font-semibold text-slate-200 leading-snug hover:text-indigo-200 transition-colors"
                                            title="Switch line"
                                        >
                                            {lineOptions.find(l => l.id === selectedLineId)?.label || lineOptions[0].label}
                                        </button>
                                        {linePickerOpen && (
                                            <div className="absolute right-0 z-20 mt-1 w-56 max-h-56 overflow-auto bg-slate-900 border border-slate-800 rounded-lg shadow-xl p-1">
                                                {lineOptions.map(opt => (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => {
                                                            setLinePickerOpen(false);
                                                            if (opt.id !== selectedLineId) {
                                                                onSelectLine(opt.id);
                                                            }
                                                        }}
                                                        className="w-full text-left px-2 py-1.5 rounded-md text-sm text-slate-100 hover:bg-indigo-500/10 transition-colors"
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Log */}
                    {!hideLog && (
                        <div className="flex flex-col flex-1 min-h-0 bg-white/85 border border-slate-200 rounded-xl shadow-md overflow-hidden dark:bg-slate-900/70 dark:border-slate-800 dark:shadow-lg transition-colors duration-200">
                            <div className="flex items-center justify-between p-2 border-b border-slate-200 text-xs font-semibold text-slate-700 shrink-0 bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:bg-slate-900/80">
                                <span>Line Moves</span>
                                {!logRevealed && (
                                    <button
                                        onClick={() => {
                                            setLogRevealed(true);
                                            setHintsUsed(true);
                                            setIsMovesExpanded(true);
                                        }}
                                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 font-semibold transition-colors duration-150 hover:bg-indigo-100 hover:text-indigo-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/80 cursor-pointer dark:border-indigo-400/40 dark:bg-indigo-500/15 dark:text-indigo-100 dark:hover:bg-indigo-500/25 dark:hover:text-white"
                                    >
                                        <HelpCircle size={12} /> Reveal all
                                    </button>
                                )}
                            </div>
                            {renderMoveLogContent()}
                        </div>
                    )}

                    {/* Captured pieces */}
                    <div className="bg-slate-50/95 border border-slate-200 rounded-xl p-2 shadow-md space-y-2 shrink-0 dark:bg-white/10 dark:border-white/10 dark:ring-1 dark:ring-white/10 dark:shadow-lg transition-colors duration-200">
                        <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider opacity-80 dark:text-slate-300">Captured</div>
                        {renderCaptured(capturedWhite, "White", 'b', materialDiff > 0 ? materialDiff : undefined)}
                        {renderCaptured(capturedBlack, "Black", 'w', materialDiff < 0 ? Math.abs(materialDiff) : undefined)}
                    </div>

                    {/* Practice Mode (Moved to Bottom) */}
                    <div className="bg-white/80 p-2 rounded-xl border border-slate-200 shrink-0 shadow-sm dark:bg-slate-900/60 dark:border-slate-800 transition-colors duration-200">
                        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                            <span className="font-semibold">Practice Mode</span>
                            <select
                                value={wrongMoveMode}
                                onChange={(e) => {
                                    const val = e.target.value === 'stay' ? 'stay' : 'snap';
                                    setWrongMoveMode(val);
                                    if (typeof window !== 'undefined') {
                                        localStorage.setItem('wrongMoveMode', val);
                                    }
                                }}
                                className="bg-white border border-slate-300 rounded px-2 py-1 text-xs cursor-pointer hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-800 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                            >
                                <option value="snap">Snap back</option>
                                <option value="stay">Wait to Revert</option>
                            </select>
                        </div>
                    </div>
                    {sidebarFooter && (
                        <div className="mt-1">
                            {sidebarFooter}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
