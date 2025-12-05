import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessground } from 'chessground';
import type { Move as APIMove } from '../types';
import { RotateCcw, CheckCircle, XCircle, HelpCircle, Brain } from 'lucide-react';
import clsx from 'clsx';
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
    sessionType
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
        const config = {
            fen: wrongMoveView ? wrongMoveView.fen : game.fen(),
            orientation: orientation,
            viewOnly: isLocked,
            turnColor: game.turn() === 'w' ? 'white' : 'black',
            animation: {
                enabled: true,
                duration: 200
            },
            movable: isLocked ? {
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

    // Derived helpers
    const totalMoves = mode === 'sequence' && targetMoves ? targetMoves.length : (mode === 'mistake' ? 1 : 0);
    const remainingMoves = totalMoves > 0 ? Math.max(totalMoves - moveIndex, 0) : 0;

    const historyVerbose = (() => {
        try { return game.history({ verbose: true }) as any[]; } catch { return []; }
    })();
    const capturedWhite: string[] = [];
    const capturedBlack: string[] = [];
    historyVerbose.forEach((mv) => {
        if (mv.captured) {
            if (mv.color === 'w') {
                // white captured black piece
                capturedWhite.push(mv.captured);
            } else {
                capturedBlack.push(mv.captured);
            }
        }
    });

    const getPieceSymbol = (type: string, color: 'w' | 'b') => {
        // Unicode Chess Pieces
        const symbols: Record<string, string> = {
            'p': '♟', 'n': '♞', 'b': '♝', 'r': '♜', 'q': '♛', 'k': '♚', // Black style
            'P': '♙', 'N': '♘', 'B': '♗', 'R': '♖', 'Q': '♕', 'K': '♔'  // White style
        };
        // Note: Usually captures are shown as the piece type captured.
        // We can use the same symbols or color them.
        // Here we return the generic symbol key.
        // If we want White Captured pieces (which are Black pieces), we return black symbols?
        // Or we just return the type and style it.
        // Let's return the type and use CSS for color.
        const mapping: Record<string, string> = {
            'p': '♟', 'n': '♞', 'b': '♝', 'r': '♜', 'q': '♛', 'k': '♚'
        };
        return mapping[type] || type;
    };

    const renderCaptured = (list: string[], label: string, pieceColor: 'w' | 'b') => (
        <div className="flex items-center gap-2 text-xs text-gray-700">
            <span className="font-semibold min-w-[80px]">{label}:</span>
            <div className="flex gap-1 flex-wrap">
                {list.length === 0 && <span className="text-gray-400 italic">None</span>}
                {list.map((p, idx) => (
                    <span 
                        key={idx} 
                        className={clsx(
                            "text-lg leading-none",
                            pieceColor === 'b' ? "text-black" : "text-gray-500 drop-shadow-sm" // styling for white pieces to stand out
                        )}
                    >
                        {getPieceSymbol(p, pieceColor)}
                    </span>
                ))}
            </div>
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
        <div className="flex flex-col lg:flex-row gap-6 justify-center items-start w-full">
            
            {/* Left Column: Board + Progress + Status */}
            <div className="flex flex-col w-full max-w-2xl gap-3">
                {/* Progress */}
                <div className="w-full shrink-0">
                    <div className="flex justify-between text-xs text-gray-600 mb-1 font-medium">
                        <span>Progress</span>
                        <span>{remainingMoves} moves remaining</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-blue-500 transition-all duration-500 ease-out"
                            style={{ width: totalMoves > 0 ? `${((moveIndex) / totalMoves) * 100}%` : '0%' }}
                        />
                    </div>
                </div>

                {/* Board Container */}
                <div className="w-full aspect-square rounded overflow-hidden relative bg-gray-200">
                    <div 
                        ref={containerRef} 
                        className="w-full h-full block" 
                    />
                </div>

                {/* Status Bar */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 flex items-center justify-between w-full shrink-0">
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
            <div className="flex flex-col w-full lg:w-[300px] gap-3 shrink-0">
                
                {/* Session Info (Moved from Header) */}
                <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                     <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wide mb-1">
                        <Brain size={12} />
                        {sessionType === 'mistake' && "Fix Blunder"}
                        {sessionType === 'srs_review' && "Review"}
                        {sessionType === 'new_learn' && "Learn"}
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 leading-snug">
                        {sessionTitle}
                    </h3>
                </div>

                {/* Log */}
                <div className="flex flex-col flex-1 min-h-0 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden max-h-[300px] lg:max-h-[400px]">
                        <div className="flex items-center justify-between p-3 border-b border-gray-100 text-xs font-semibold text-gray-700 shrink-0 bg-gray-50/50">
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
                <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm space-y-2 shrink-0">
                    <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider opacity-75">Captured</div>
                    {renderCaptured(capturedWhite, "White", 'b')}
                    {renderCaptured(capturedBlack, "Black", 'w')}
                </div>

                {/* Practice Mode (Moved to Bottom) */}
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
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
    );
};
