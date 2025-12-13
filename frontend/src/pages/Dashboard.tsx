import React, { useState, useEffect, useMemo } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { Zap, ChevronRight, Lock, LogIn, Target, Star, Check, BookOpen } from 'lucide-react';
import { api } from '../api/client';
import type { Opening, RepertoireResponse } from '../types';
import { useUpgradeNavigation } from '../hooks/useUpgradeNavigation';

export const Dashboard: React.FC = () => {
    const { user, loading } = useUser();
    const [repertoire, setRepertoire] = useState<RepertoireResponse | null>(null);
    const [openingsLookup, setOpeningsLookup] = useState<Record<string, Opening>>({});
    const [repertoireLoading, setRepertoireLoading] = useState(true);
    const [repertoireFilter, setRepertoireFilter] = useState<'all' | 'white' | 'black'>('all');
    const navigate = useNavigate();
    const { goToPricing } = useUpgradeNavigation();

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

    if (loading) return <div className="flex justify-center p-10 text-slate-400">Loading...</div>;

    if (!user || !user.is_authenticated || user.level === undefined) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-2xl mb-6 shadow-lg shadow-indigo-900/30">
                    <Zap className="w-12 h-12 text-indigo-300" />
                </div>
                <h2 className="text-3xl font-semibold text-slate-900 dark:text-white mb-3">Welcome to Chess Trainer</h2>
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-xl">
                    Master openings, fix your blunders, and track your progress with spaced repetition.
                </p>
                <a
                    href="/admin/login/?next=/"
                    className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white px-8 py-3 rounded-full font-semibold transition shadow-lg shadow-indigo-900/30"
                >
                    <LogIn className="w-5 h-5" />
                    Log In to Start
                </a>
                <p className="mt-4 text-sm text-slate-500">
                    (Uses Django Admin authentication)
                </p>
            </div>
        );
    }

    const xpToNextLevel = 100 - ((user.xp || 0) % 100);
    const progressPercent = ((user.xp || 0) % 100);

    return (
        <div className="space-y-8">
            {/* Hero */}
            <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-950/80 shadow-2xl shadow-black/40 p-6 sm:p-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-3xl font-black text-indigo-200 shadow-inner shadow-black/30">
                            {user.level}
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-2xl sm:text-3xl font-semibold text-white">Current Level</h2>
                            <p className="text-slate-400">Total XP: {user.xp}</p>
                        </div>
                    </div>

                    <div className="flex-1 w-full max-w-lg">
                        <div className="flex justify-between text-xs sm:text-sm mb-2 text-slate-400">
                            <span className="font-semibold text-slate-300">Progress to Level {user.level + 1}</span>
                            <span className="text-indigo-200 font-semibold">{xpToNextLevel} XP needed</span>
                        </div>
                        <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-300 rounded-full transition-all duration-700"
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                {/* My Repertoire */}
                <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 backdrop-blur-sm shadow-2xl shadow-black/40 p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                            <h3 className="text-xl font-semibold text-white">My Repertoire</h3>
                            <p className="text-slate-400 text-sm">Train only the openings you play.</p>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-800/60 p-1 rounded-full border border-slate-700">
                            {(['all', 'white', 'black'] as const).map(val => (
                                <button
                                    key={val}
                                    onClick={() => setRepertoireFilter(val)}
                                    className={`px-3 py-1.5 text-xs sm:text-sm rounded-full transition-all ${
                                        repertoireFilter === val
                                            ? 'bg-indigo-500 text-white shadow-md shadow-indigo-900/30'
                                            : 'text-slate-300 hover:text-white'
                                    }`}
                                >
                                    {val === 'all' ? 'All' : val === 'white' ? 'White' : 'Black'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-5">
                        {repertoireLoading ? (
                            <div className="text-sm text-slate-500">Loading repertoire...</div>
                        ) : repertoireEntries.length === 0 ? (
                            <div className="text-sm text-slate-400 border border-dashed border-slate-700 rounded-xl p-5 flex flex-col gap-3 bg-slate-900/40">
                                <span>You haven’t added any openings to your repertoire yet. Go to Openings to star your favourite lines.</span>
                                <button
                                    onClick={() => navigate('/openings')}
                                    className="self-start px-4 py-2 text-sm font-semibold text-indigo-200 hover:text-white bg-indigo-500/10 border border-indigo-500/20 rounded-full transition"
                                >
                                    Go to Openings
                                </button>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-4">
                                {repertoireEntries.map(item => (
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/train?side=${item.side}&opening_id=${item.opening_id}&repertoire_only=true&mode=review`)}
                                        key={`${item.side}-${item.opening_id}`}
                                        className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex items-center justify-between gap-2 text-left hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-900/30 transition"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Star className="w-4 h-4 text-amber-300" fill="#fcd34d" />
                                            <div>
                                                <div className="font-semibold text-white hover:underline">{item.name}</div>
                                                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                                    <span className="px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800/70 text-white">
                                                        {item.side === 'white' ? 'White' : 'Black'}
                                                    </span>
                                                    <span>{item.progressLabel}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-indigo-500/20 text-indigo-100 border border-indigo-500/30">
                                                {Math.round(item.progressPct)}%
                                            </span>
                                            {item.mastered && <Check className="w-4 h-4 text-emerald-400" />}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-4">
                    <div onClick={() => navigate('/openings')} className="block group cursor-pointer">
                        <div className="rounded-2xl p-6 bg-gradient-to-r from-indigo-600/80 via-indigo-500/70 to-slate-900/80 border border-indigo-500/30 text-white shadow-xl shadow-indigo-900/40 transition-transform transform group-hover:-translate-y-1 group-hover:shadow-2xl">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-semibold mb-1 flex items-center gap-2">
                                        <BookOpen className="h-5 w-5" />
                                        Practice Openings
                                    </h3>
                                    <p className="text-indigo-100/80 text-sm">Browse your repertoire</p>
                                </div>
                                <ChevronRight className="w-8 h-8 opacity-70 group-hover:opacity-100 transition" />
                            </div>
                        </div>
                    </div>

                    {/* Opening Drill Card */}
                    <div onClick={() => navigate('/drill')} className="block group cursor-pointer">
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 transition transform group-hover:-translate-y-1 group-hover:border-indigo-500/40 group-hover:shadow-xl group-hover:shadow-indigo-900/40">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-semibold text-white mb-1 flex items-center gap-2">
                                        <Target className="text-rose-300" /> Opening Drill
                                    </h3>
                                    <p className="text-slate-400 text-sm">
                                        Spaced repetition training
                                    </p>
                                </div>
                                <ChevronRight className="w-8 h-8 text-slate-500 group-hover:text-rose-300 transition" />
                            </div>
                        </div>
                    </div>

                    <div onClick={() => navigate('/train?mode=one_move')} className="block group cursor-pointer">
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 transition transform group-hover:-translate-y-1 group-hover:border-indigo-500/40 group-hover:shadow-xl group-hover:shadow-indigo-900/40">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-semibold text-white mb-1 flex items-center gap-2">
                                        <Zap className="text-indigo-300" /> One Move Drill
                                    </h3>
                                    <p className="text-slate-400 text-sm">Continue your daily streak</p>
                                    {(user as any).one_move_best_streak !== undefined && (
                                        <p className="text-xs font-semibold text-indigo-200 mt-1">
                                            Best Streak: {(user as any).one_move_best_streak}
                                        </p>
                                    )}
                                </div>
                                <ChevronRight className="w-8 h-8 text-slate-500 group-hover:text-indigo-300 transition" />
                            </div>
                        </div>
                    </div>

                    {/* Premium Banner */}
                    {!user.effective_premium && (
                        <div className="rounded-2xl p-5 border border-indigo-500/30 bg-indigo-900/40 backdrop-blur-sm shadow-inner shadow-indigo-900/40">
                            <div className="flex items-center gap-3 mb-2">
                                <Lock className="text-indigo-200 w-5 h-5" />
                                <h3 className="font-semibold text-indigo-100">Premium Features</h3>
                            </div>
                            <p className="text-sm text-indigo-100/80 mb-4">
                                Unlock unlimited variations and detailed analytics.
                            </p>
                            <button
                                type="button"
                                onClick={goToPricing}
                                className="text-sm font-semibold text-slate-900 bg-indigo-300 hover:bg-white px-4 py-2 rounded-full transition shadow-md shadow-indigo-900/30"
                            >
                                Upgrade now
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
