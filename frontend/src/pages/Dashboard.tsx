import React, { useState, useEffect, useMemo } from 'react';
import { useUser } from '../context/UserContext';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, ChevronRight, Lock, LogIn, Target, Star, Check } from 'lucide-react';
import { api } from '../api/client';
import type { Opening, RepertoireResponse } from '../types';

export const Dashboard: React.FC = () => {
    const { user, loading } = useUser();
    const [repertoire, setRepertoire] = useState<RepertoireResponse | null>(null);
    const [openingsLookup, setOpeningsLookup] = useState<Record<string, Opening>>({});
    const [repertoireLoading, setRepertoireLoading] = useState(true);
    const [repertoireFilter, setRepertoireFilter] = useState<'all' | 'white' | 'black'>('all');
    const navigate = useNavigate();

    useEffect(() => {
        if (!user?.is_authenticated) {
            setRepertoireLoading(false);
            return;
        }
        setRepertoireLoading(true);
        Promise.all([api.getRepertoire(), api.getOpenings()])
            .then(([rep, openingsData]) => {
                setRepertoire(rep);
                const lookup: Record<string, Opening> = {};
                Object.values(openingsData).forEach(openings => {
                    openings.forEach((o: Opening) => {
                        lookup[o.id] = o;
                    });
                });
                setOpeningsLookup(lookup);
            })
            .catch(console.error)
            .finally(() => setRepertoireLoading(false));
    }, [user]);

    const repertoireEntries = useMemo(() => {
        if (!repertoire) return [];
        const items = [...(repertoire.white || []), ...(repertoire.black || [])].map(item => {
            const meta = openingsLookup[item.opening_id];
            const total = meta?.progress?.total ?? 0;
            const completed = meta?.progress?.completed ?? 0;
            const mastered = total > 0 && completed >= total;
            const progressLabel = total > 0 ? `${completed} / ${total} lines` : 'No lines trained';
            const progressPct = meta?.progress?.percentage ?? 0;
            return {
                ...item,
                side: (item as any).side || item.side || 'white',
                name: meta?.name || item.name,
                progressLabel,
                mastered,
                progressPct,
            };
        });
        if (repertoireFilter === 'white') return items.filter(i => (i.side || '').toLowerCase() === 'white');
        if (repertoireFilter === 'black') return items.filter(i => (i.side || '').toLowerCase() === 'black');
        return items;
    }, [repertoire, openingsLookup, repertoireFilter]);

    if (loading) return <div className="flex justify-center p-10">Loading...</div>;
    
    if (!user || !user.is_authenticated || user.level === undefined) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="bg-blue-50 p-4 rounded-full mb-6">
                    <Zap className="w-12 h-12 text-blue-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Chess Trainer</h2>
                <p className="text-lg text-gray-600 mb-8 max-w-md">
                    Master openings, fix your blunders, and track your progress with spaced repetition.
                </p>
                <a 
                    href="/admin/login/?next=/" 
                    className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                >
                    <LogIn className="w-5 h-5" />
                    Log In to Start
                </a>
                <p className="mt-4 text-sm text-gray-500">
                    (Uses Django Admin authentication)
                </p>
            </div>
        );
    }

    const xpToNextLevel = 100 - ((user.xp || 0) % 100);
    const progressPercent = ((user.xp || 0) % 100);

    return (
        <div className="space-y-6">
            {/* Stats Hero */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl font-bold border-4 border-blue-50">
                            {user.level}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">Current Level</h2>
                            <p className="text-gray-500">Total XP: {user.xp}</p>
                        </div>
                    </div>
                    
                    <div className="flex-1 w-full max-w-md">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="font-medium text-gray-600">Progress to Level {user.level + 1}</span>
                            <span className="text-blue-600 font-bold">{xpToNextLevel} XP needed</span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
                {/* My Repertoire */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">My Repertoire</h3>
                            <p className="text-gray-500">Train only the openings you play.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {(['all', 'white', 'black'] as const).map(val => (
                                <button
                                    key={val}
                                    onClick={() => setRepertoireFilter(val)}
                                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                                        repertoireFilter === val
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    {val === 'all' ? 'All' : val === 'white' ? 'White' : 'Black'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-4">
                        {repertoireLoading ? (
                            <div className="text-sm text-gray-400">Loading repertoire...</div>
                        ) : repertoireEntries.length === 0 ? (
                            <div className="text-sm text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-lg p-4 flex flex-col gap-2">
                                <span>You haven’t added any openings to your repertoire yet. Go to Openings to star your favourite lines.</span>
                                <button
                                    onClick={() => navigate('/openings')}
                                    className="self-start px-3 py-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800"
                                >
                                    Go to Openings
                                </button>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-3">
                                {repertoireEntries.map(item => (
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/train?side=${item.side}&opening_id=${item.opening_id}&repertoire_only=true&mode=review`)}
                                        key={`${item.side}-${item.opening_id}`}
                                        className="border border-gray-200 rounded-lg p-3 bg-gray-50 flex items-center justify-between gap-2 text-left hover:border-blue-200 hover:bg-white transition"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Star className="w-4 h-4 text-yellow-500" fill="#facc15" />
                                            <div>
                                                <div className="font-semibold text-gray-900 hover:underline">{item.name}</div>
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <span className="px-2 py-0.5 rounded-full border border-gray-200 bg-white">
                                                        {item.side === 'white' ? 'White' : 'Black'}
                                                    </span>
                                                    <span>{item.progressLabel}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-800">
                                                {Math.round(item.progressPct)}%
                                            </span>
                                            {item.mastered && <Check className="w-4 h-4 text-green-600" />}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-4">
                    <Link to="/openings" className="block group">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-md p-6 text-white transition-transform transform hover:-translate-y-1">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold mb-1">Practice Openings</h3>
                                    <p className="text-blue-100">Browse your repertoire</p>
                                </div>
                                <ChevronRight className="w-8 h-8 opacity-50 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </div>
                    </Link>

                    {/* Opening Drill Card */}
                    <Link to="/drill" className="block group">
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 transition-transform transform hover:-translate-y-1 hover:shadow-md">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-1 flex items-center gap-2">
                                        <Target className="text-red-500" /> Opening Drill
                                    </h3>
                                    <p className="text-gray-500">
                                        Spaced repetition training
                                    </p>
                                </div>
                                <ChevronRight className="w-8 h-8 text-gray-300 group-hover:text-red-500 transition-colors" />
                            </div>
                        </div>
                    </Link>

                    <Link to="/train" className="block group">
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 transition-transform transform hover:-translate-y-1 hover:shadow-md">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-1 flex items-center gap-2">
                                        <Zap className="text-blue-600" /> One Move Drill
                                    </h3>
                                    <p className="text-gray-500">Continue your daily streak</p>
                                </div>
                                <ChevronRight className="w-8 h-8 text-gray-300 group-hover:text-blue-500 transition-colors" />
                            </div>
                        </div>
                    </Link>

                    {/* Premium Banner */}
                    {!user.effective_premium && (
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                            <div className="flex items-center gap-3 mb-2">
                                <Lock className="text-purple-600 w-5 h-5" />
                                <h3 className="font-bold text-purple-800">Premium Features</h3>
                            </div>
                            <p className="text-sm text-purple-600 mb-3">
                                Unlock unlimited variations and detailed analytics.
                            </p>
                            <button className="text-sm font-bold text-purple-700 hover:text-purple-900 underline">
                                Upgrade now
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
