import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessground } from 'chessground';
import type { Move as APIMove } from '../types';
import { RotateCcw, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
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
}

export const GameArea: React.FC<GameAreaProps> = ({ 
    initialFen, 
    orientation = 'white', 
    targetMoves, 
    targetNextMove, 
    onComplete, 
    onMistake,
    mode,
    locked = false
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
    
    const containerRef = useRef<HTMLDivElement>(null);
    const groundRef = useRef<any>(null);

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
            fen: game.fen(),
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
    }, [game, orientation, locked]);

    // Handle Move Logic
    const handleMove = (source: string, target: string) => {
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
                
                // Snap back
                setTimeout(() => {
                    if (groundRef.current) {
                        groundRef.current.set({
                            fen: game.fen(),
                            turnColor: game.turn() === 'w' ? 'white' : 'black',
                            lastMove: undefined,
                            movable: {
                                color: orientation,
                                dests: toDests(game)
                            }
                        });
                    }
                    setTimeout(() => setFeedback(null), 1500);
                }, 400);
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

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="w-full max-w-[400px] aspect-square shadow-lg rounded-lg overflow-hidden bg-[#dfc2a2]">
                <div 
                    ref={containerRef} 
                    style={{ width: '100%', height: '100%' }} 
                    className="cg-board-wrap"
                />
            </div>
            
            <div className="w-full max-w-[400px] min-h-[60px] bg-white rounded-lg shadow-sm border p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {feedback === 'correct' && <span className="text-green-600 font-bold flex items-center gap-1"><CheckCircle size={18}/> Correct!</span>}
                    {feedback === 'wrong' && <span className="text-red-600 font-bold flex items-center gap-1"><XCircle size={18}/> Incorrect</span>}
                    {!feedback && <span className="text-gray-500 italic">Make your move...</span>}
                </div>
                
                <div className="flex gap-2">
                    <button 
                        onClick={() => {
                            const mv = mode === 'mistake' ? targetNextMove : targetMoves?.[moveIndex]?.san;
                            setHint(mv || "No move available");
                            setHintsUsed(true);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
                        title="Hint"
                    >
                        <HelpCircle size={20} />
                    </button>
                    <button 
                        onClick={() => {
                            // Reset Logic - Trigger re-render via state or key (if we used key)
                            // Here we just re-run initialization logic essentially
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
                            
                            // Also clear board highlights / last move immediately
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
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
                        title="Reset Position"
                    >
                        <RotateCcw size={20} />
                    </button>
                </div>
            </div>
            
            {hint && <div className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Hint: {hint}</div>}
        </div>
    );
};
