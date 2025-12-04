import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import type { RecallSessionResponse } from '../types';
import { GameArea } from '../components/GameArea';
import { useUser } from '../context/UserContext';
import { Brain, Trophy, ArrowRight } from 'lucide-react';

export const Train: React.FC = () => {
    const { user, refreshUser } = useUser();
    const [searchParams] = useSearchParams();
    const [session, setSession] = useState<RecallSessionResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [completed, setCompleted] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const fetchSession = useCallback(async () => {
        setLoading(true);
        setCompleted(false);
        setMessage(null);
        try {
            const variationId = searchParams.get('id');
            const data = await api.getRecallSession(variationId || undefined);
            setSession(data);
        } catch (err: any) {
            console.error("Failed to fetch session", err);
            if (err.response?.status === 403) {
                setMessage("You are out of stamina for today! Come back tomorrow.");
            } else {
                setMessage("No training available right now.");
            }
        } finally {
            setLoading(false);
        }
    }, [searchParams]);

    useEffect(() => {
        fetchSession();
    }, [fetchSession]);

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
                <p className="text-gray-500 mb-6">Great job keeping your repertoire sharp.</p>
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
        <div className="max-w-2xl mx-auto">
            <div className="mb-6 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-2">
                    <Brain size={16} />
                    {session.type === 'mistake' && "Fix Your Blunder"}
                    {session.type === 'srs_review' && "Spaced Repetition Review"}
                    {session.type === 'new_learn' && "Learn New Line"}
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                    {session.type === 'mistake' ? session.variation_name : session.name}
                </h2>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                <GameArea
                    mode={session.type === 'mistake' ? 'mistake' : 'sequence'}
                    initialFen={session.type === 'mistake' ? session.fen : undefined}
                    targetNextMove={session.type === 'mistake' ? session.correct_move : undefined}
                    targetMoves={session.type !== 'mistake' ? session.moves : undefined}
                    orientation={session.orientation}
                    onComplete={handleComplete}
                    onMistake={handleMistake}
                    locked={completed}
                />

                {completed && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-4 flex flex-col gap-3">
                        <div className="flex items-center gap-3 text-green-700">
                            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                <Trophy size={22} />
                            </div>
                            <div>
                                <div className="font-bold text-green-800">Session Complete</div>
                                <div className="text-sm font-semibold">{message}</div>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button 
                                onClick={fetchSession} 
                                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                            >
                                Next Exercise <ArrowRight size={16} />
                            </button>
                            <button
                                onClick={() => {
                                    // rerun the same session if id present; otherwise fetchSession will give random
                                    setCompleted(false);
                                    setMessage(null);
                                    fetchSession();
                                }}
                                className="inline-flex items-center gap-2 bg-white text-blue-700 border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-50 transition"
                            >
                                Train Again
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

