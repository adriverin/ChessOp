import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { Link, useNavigate } from 'react-router-dom';
import { Award, Zap, ChevronRight, Lock, LogIn, Target, BarChart2, ArrowRight } from 'lucide-react';
import { api } from '../api/client';
import type { ThemeStat } from '../types';

export const Dashboard: React.FC = () => {
    const { user, loading } = useUser();
    const [themeStats, setThemeStats] = useState<ThemeStat[]>([]);
    const [statsLoading, setStatsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (user?.is_authenticated) {
            // Fetch Theme Stats
            api.getThemeStats()
                .then(data => setThemeStats(data.themes))
                .catch(console.error)
                .finally(() => setStatsLoading(false));
        } else {
            setStatsLoading(false);
        }
    }, [user]);

    const handleTrainTheme = (theme: string) => {
        navigate(`/train?themes=${theme}`);
    };

    const handleTrainWeakest = () => {
        // Pick top 3 weakest themes
        const weakest = themeStats.slice(0, 3).map(t => t.name).join(',');
        navigate(`/train?themes=${weakest}`);
    };

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

            <div className="grid md:grid-cols-2 gap-6">
                {/* Daily Quests */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Award className="text-yellow-500" /> Daily Quests
                    </h3>
                    <div className="space-y-4">
                        {user.quests?.map((quest, idx) => (
                            <div key={idx} className={`p-4 rounded-lg border ${quest.completed ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className={`font-semibold ${quest.completed ? 'text-green-800' : 'text-gray-800'}`}>
                                        {quest.title}
                                    </h4>
                                    <span className="px-2 py-1 bg-white rounded text-xs font-bold text-yellow-600 shadow-sm border border-yellow-100">
                                        +{quest.reward} XP
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mb-3">{quest.description}</p>
                                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full transition-all ${quest.completed ? 'bg-green-500' : 'bg-blue-500'}`}
                                        style={{ width: `${Math.min(100, (quest.progress / quest.target) * 100)}%` }}
                                    ></div>
                                </div>
                                <div className="text-right text-xs mt-1 text-gray-500">
                                    {quest.progress} / {quest.target}
                                </div>
                            </div>
                        ))}
                        {(!user.quests || user.quests.length === 0) && (
                            <p className="text-gray-400 italic text-center py-4">No quests available today.</p>
                        )}
                    </div>
                </div>

                {/* Right Column Stack */}
                <div className="space-y-6">
                    {/* Weakest Themes Widget */}
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <BarChart2 className="text-orange-500" /> Weakest Themes
                            </h3>
                            {!statsLoading && themeStats.length > 0 && (
                                <button 
                                    onClick={handleTrainWeakest}
                                    className="text-xs font-bold text-orange-600 hover:text-orange-800 flex items-center gap-1"
                                >
                                    Train All <ArrowRight size={12} />
                                </button>
                            )}
                        </div>
                        
                        {statsLoading ? (
                            <div className="text-center py-4 text-gray-400">Loading stats...</div>
                        ) : themeStats.length === 0 ? (
                            <div className="text-center py-4 text-gray-400 italic bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                <p>Play more games to track your theme performance!</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {themeStats.slice(0, 3).map(stat => (
                                    <div key={stat.name} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100 group">
                                        <div>
                                            <div className="font-medium text-gray-800 capitalize">{stat.name.replace(/_/g, ' ')}</div>
                                            <div className="text-xs text-gray-500">
                                                {stat.successes}/{stat.attempts} correct ({Math.round(stat.accuracy * 100)}%)
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleTrainTheme(stat.name)}
                                            className="px-3 py-1.5 bg-white text-orange-600 text-xs font-bold rounded-md border border-orange-200 shadow-sm hover:bg-orange-100 transition-colors"
                                        >
                                            Train
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-4">
                        <Link to="/train" className="block group">
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-md p-6 text-white transition-transform transform hover:-translate-y-1">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                                            <Zap className="fill-current" /> Start Training
                                        </h3>
                                        <p className="text-blue-100">Continue your daily streak</p>
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
                                            Test your opening mastery
                                        </p>
                                    </div>
                                    <ChevronRight className="w-8 h-8 text-gray-300 group-hover:text-red-500 transition-colors" />
                                </div>
                            </div>
                        </Link>

                        <Link to="/openings" className="block group">
                            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 transition-transform transform hover:-translate-y-1 hover:shadow-md">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800 mb-1">Review Openings</h3>
                                        <p className="text-gray-500">Browse your repertoire</p>
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
        </div>
    );
};
