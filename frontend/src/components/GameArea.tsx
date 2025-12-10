import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Chess } from 'chess.js';
import { Chessground } from 'chessground';
import type { Move as APIMove } from '../types';
import { RotateCcw, CheckCircle, XCircle, HelpCircle, Brain } from 'lucide-react';
import clsx from 'clsx';
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
    sessionType,
    opening,
    openingOptions,
    onSelectOpening,
    showInlineProgress = true,
    onRemainingMovesChange,
    lineOptions,
    selectedLineId,
    onSelectLine,
    headerMode = 'training'
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
    const [wrongMoveView, setWrongMoveView] = useState<{ fen: string; lastMove?: [string, string] } | null>(null);
    const [wrongMoveMode, setWrongMoveMode] = useState<'snap' | 'stay'>(() => {
        const saved = typeof window !== 'undefined' ? localStorage.getItem('wrongMoveMode') : null;
        return saved === 'stay' ? 'stay' : 'snap';
    });
    const [logRevealed, setLogRevealed] = useState(false);
    const [openingPickerOpen, setOpeningPickerOpen] = useState(false);
    const [linePickerOpen, setLinePickerOpen] = useState(false);
    
    const activeMoveRef = useRef<HTMLDivElement>(null);
    const logContainerRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const groundRef = useRef<any>(null);

    useEffect(() => {
        if (activeMoveRef.current && logContainerRef.current) {
            const container = logContainerRef.current;
            const element = activeMoveRef.current;
            
            const containerRect = container.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();
            
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
                                        setMoveIndex(nextIndex + 1);
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
                onMistake(fenBeforeMove, playedSan, expectedMove);

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
        setFeedback(null);
        setHint(null);
        setHintsUsed(false);
        setWrongMoveView(null);
        setLogRevealed(false);

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

    const userMovesCompleted = useMemo(() => {
        if (mode === 'mistake') return feedback === 'correct' ? 1 : 0;
        if (mode !== 'sequence' || !targetMoves) return 0;
        return userMoveIndices.filter(idx => idx < moveIndex).length;
    }, [mode, targetMoves, userMoveIndices, moveIndex, feedback]);

    const remainingMoves = useMemo(() => {
        if (totalUserMoves === 0) return 0;
        return Math.max(totalUserMoves - userMovesCompleted, 0);
    }, [totalUserMoves, userMovesCompleted]);

    const progressPercent = totalUserMoves === 0 ? 100 : (userMovesCompleted / totalUserMoves) * 100;

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
        <div className="flex items-center gap-2 text-xs text-gray-700">
            <span className="font-semibold min-w-[80px]">{label}:</span>
            <div className="flex gap-1 flex-wrap items-center">
                {list.length === 0 && <span className="text-gray-400 italic">None</span>}
                {list.map((p, idx) => (
                    <img
                        key={idx}
                        src={PIECE_IMAGES[pieceColor + p.toLowerCase()] || ''}
                        alt={p}
                        className="w-6 h-6 select-none"
                    />
                ))}
            </div>
            {aheadBy && aheadBy > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-semibold border border-emerald-100">
                    +{aheadBy}
                </span>
            )}
        </div>
    );

    const renderMoveLogContent = () => (
        <div 
            ref={logContainerRef}
            className="flex-1 min-h-0 overflow-auto space-y-1 text-xs pr-1 p-2"
        >
            {targetMoves && targetMoves.map((mv, idx) => {
                const isCurrent = idx === moveIndex;
                const isPast = idx < moveIndex;
                const shouldBlur = !logRevealed && !isPast;
                const isBlackMove = idx % 2 === 1;
                
                return (
                    <div 
                        key={idx}
                        ref={isCurrent ? activeMoveRef : null}
                        className={clsx(
                            "flex items-start gap-2 px-2 py-1 rounded border transition-colors",
                            isCurrent ? "bg-blue-50 border-blue-200 ring-1 ring-blue-100" : "border-transparent",
                            !isCurrent && isBlackMove ? "bg-gray-100" : (!isCurrent && "bg-white"),
                            shouldBlur ? "opacity-50" : ""
                        )}
                    >
                        <span className="text-[10px] text-gray-400 font-mono w-5 text-right pt-0.5">{idx + 1}.</span>
                        
                        <div className="flex flex-col w-full">
                            <div className="flex items-center gap-2">
                                <span className={clsx(
                                    "font-bold text-sm",
                                    shouldBlur ? "blur-md select-none text-transparent bg-gray-300 rounded w-6 h-4 inline-block" : (
                                        isBlackMove ? "text-gray-900" : "text-blue-900"
                                    )
                                )}>
                                    {shouldBlur ? "???" : mv.san}
                                </span>
                                {!shouldBlur && (
                                    <span className={clsx(
                                        "text-[9px] px-1 py-0.5 rounded-full font-bold tracking-wide uppercase",
                                        isBlackMove ? "bg-gray-800 text-gray-100" : "bg-gray-200 text-gray-700 border border-gray-300"
                                    )}>
                                        {isBlackMove ? "Black" : "White"}
                                    </span>
                                )}
                            </div>
                            <span className={clsx(
                                "text-[10px] text-gray-600 mt-0.5",
                                shouldBlur ? "blur-sm select-none opacity-40" : ""
                            )}>
                                {mv.desc}
                            </span>
                        </div>
                    </div>
                );
            })}
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

    return (
        <div className="flex flex-col lg:flex-row gap-4 justify-center items-stretch w-full">
            
            {/* Left Column: Board + Progress + Status */}
            <div className="flex flex-col w-full max-w-2xl gap-2">
                {showInlineProgress && (
                    <div className="w-full shrink-0">
                        <div className="flex justify-between text-xs text-gray-600 mb-1 font-medium">
                            <span>Progress</span>
                            <span>{totalUserMoves === 0 ? '0 moves to play' : `${remainingMoves} moves remaining`}</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-blue-500 transition-all duration-500 ease-out"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Board Container */}
                <div className="w-full aspect-square rounded overflow-hidden relative bg-gray-200">
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
                                <div className="absolute top-0 right-0 w-3 h-3 bg-red-600 rounded-full shadow-sm ring-1 ring-white m-1" />
                            </div>
                        );
                    })()}
                </div>

                {/* Status Bar */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 flex items-center justify-between w-full shrink-0">
                    <div className="flex items-center gap-3">
                        {feedback === 'correct' && <span className="text-green-600 font-bold flex items-center gap-1.5 text-sm"><CheckCircle size={18}/> Correct!</span>}
                        {feedback === 'wrong' && <span className="text-red-600 font-bold flex items-center gap-1.5 text-sm"><XCircle size={18}/> Incorrect</span>}
                        {!feedback && <span className="text-gray-500 italic text-sm font-medium">Make your move...</span>}
                        {wrongMoveView && wrongMoveMode === 'stay' && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded font-semibold">Wrong move</span>
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
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 disabled:opacity-50 transition-colors"
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
                                setFeedback(null);
                                setHint(null);
                                setHintsUsed(false);
                                setWrongMoveView(null);
                                setLogRevealed(false);
                                
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
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 disabled:opacity-50 transition-colors"
                            title="Reset Position"
                        >
                            <RotateCcw size={18} />
                        </button>
                        {wrongMoveView && wrongMoveMode === 'stay' && (
                            <button
                                onClick={handleRevertWrong}
                                className="px-3 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 transition shadow-sm font-semibold"
                            >
                                Revert Board
                            </button>
                        )}
                    </div>
                </div>

                {hint && <div className="text-sm text-blue-700 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 text-center font-medium">Hint: {hint}</div>}
            </div>

            {/* Right Column: Sidebar */}
            <div className="relative flex flex-col w-full lg:w-[300px] shrink-0">
                {/* Wrapper to match height on desktop */}
                <div className="flex flex-col gap-2 lg:absolute lg:inset-0">
                    
                    {/* Session Info (Moved from Header) */}
                    <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm shrink-0 relative">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wide mb-1">
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
                                            className="text-sm font-bold text-gray-900 leading-snug hover:text-blue-700 transition-colors"
                                            title="Switch opening"
                                        >
                                            {opening.name}
                                        </button>
                                        {openingPickerOpen && (
                                            <div className="absolute right-0 z-20 mt-1 w-56 max-h-56 overflow-auto bg-white border border-gray-200 rounded-lg shadow-lg p-1">
                                                {openingOptions.map(opt => (
                                                    <button
                                                        key={opt.slug}
                                                        onClick={() => {
                                                            setOpeningPickerOpen(false);
                                                            if (opt.slug !== opening.slug) {
                                                                onSelectOpening(opt.slug);
                                                            }
                                                        }}
                                                        className="w-full text-left px-2 py-1.5 rounded-md text-sm hover:bg-blue-50 transition-colors"
                                                    >
                                                        {opt.name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <h3 className="text-sm font-bold text-gray-900 leading-snug">
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
                                            className="text-xs font-semibold text-gray-700 leading-snug hover:text-blue-700 transition-colors"
                                            title="Switch line"
                                        >
                                            {lineOptions.find(l => l.id === selectedLineId)?.label || lineOptions[0].label}
                                        </button>
                                        {linePickerOpen && (
                                            <div className="absolute right-0 z-20 mt-1 w-56 max-h-56 overflow-auto bg-white border border-gray-200 rounded-lg shadow-lg p-1">
                                                {lineOptions.map(opt => (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => {
                                                            setLinePickerOpen(false);
                                                            if (opt.id !== selectedLineId) {
                                                                onSelectLine(opt.id);
                                                            }
                                                        }}
                                                        className="w-full text-left px-2 py-1.5 rounded-md text-sm hover:bg-blue-50 transition-colors"
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
                    <div className="flex flex-col flex-1 min-h-0 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between p-2 border-b border-gray-100 text-xs font-semibold text-gray-700 shrink-0 bg-gray-50/50">
                            <span>Line Moves</span>
                            {!logRevealed && (
                                <button
                                    onClick={() => {
                                        setLogRevealed(true);
                                        setHintsUsed(true);
                                    }}
                                    className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-0.5 rounded transition-colors flex items-center gap-1"
                                >
                                    <HelpCircle size={12} /> Reveal all
                                </button>
                            )}
                        </div>
                        {renderMoveLogContent()}
                    </div>
                    
                    {/* Captured pieces */}
                    <div className="bg-white border border-gray-200 rounded-xl p-2 shadow-sm space-y-2 shrink-0">
                        <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider opacity-75">Captured</div>
                        {renderCaptured(capturedWhite, "White", 'b', materialDiff > 0 ? materialDiff : undefined)}
                        {renderCaptured(capturedBlack, "Black", 'w', materialDiff < 0 ? Math.abs(materialDiff) : undefined)}
                    </div>

                    {/* Practice Mode (Moved to Bottom) */}
                    <div className="bg-gray-50 p-2 rounded-xl border border-gray-200 shrink-0">
                        <div className="flex items-center justify-between text-xs text-gray-600">
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
                                className="bg-white border border-gray-300 rounded px-2 py-1 text-xs cursor-pointer hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            >
                                <option value="snap">Snap back</option>
                                <option value="stay">Wait to Revert</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
