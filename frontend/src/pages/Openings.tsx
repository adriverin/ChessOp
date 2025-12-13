import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { OpeningsResponse, Opening, Variation, RepertoireResponse } from '../types';
import { Lock, ChevronDown, ChevronUp, Book, Check, PlayCircle, Filter, X, Star } from 'lucide-react';
import clsx from 'clsx';
import { useUser } from '../context/UserContext';
import { GuestModeBanner } from '../components/GuestModeBanner';

export const Openings: React.FC = () => {
    const { user, loading: userLoading } = useUser();
    const [data, setData] = useState<OpeningsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedOpening, setExpandedOpening] = useState<string | null>(null);
    const [repertoire, setRepertoire] = useState<RepertoireResponse | null>(null);

    // Filters State
    const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
    const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
    const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            api.getOpenings(),
            api.getRepertoire().catch(() => null)
        ])
            .then(([openingsData, repertoireData]) => {
                setData(openingsData);
                if (repertoireData) {
                    setRepertoire(repertoireData);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const inferSideFromTags = (tags: string[]): "white" | "black" => {
        return tags.includes("Black") ? "black" : "white";
    };

    const isOpeningInRepertoire = (opening: Opening) => {
        if (!repertoire) return false;
        const side = inferSideFromTags(opening.tags);
        return (repertoire[side] || []).some(item => item.opening_id === opening.id);
    };

    const toggleOpeningInRepertoire = async (opening: Opening) => {
        const currentlyIn = isOpeningInRepertoire(opening);
        try {
            const updated = await api.toggleRepertoire(opening.id, !currentlyIn);
            setRepertoire(updated);
        } catch (err: any) {
            if (err?.response?.status === 403) {
                alert("Upgrade to add this opening to your repertoire.");
            } else {
                alert("Could not update repertoire. Please try again.");
            }
        }
    };

    // Extract unique filter options from data
    const filterOptions = useMemo(() => {
        if (!data) return { difficulties: [], goals: [], themes: [] };

        const difficulties = new Set<string>();
        const goals = new Set<string>();
        const themes = new Set<string>();

        Object.values(data).forEach(openings => {
            openings.forEach(opening => {
                opening.variations.forEach(v => {
                    if (v.difficulty) difficulties.add(v.difficulty);
                    if (v.training_goal) goals.add(v.training_goal);
                    if (v.themes) v.themes.forEach(t => themes.add(t));
                });
            });
        });

        return {
            difficulties: Array.from(difficulties).sort(),
            goals: Array.from(goals).sort(),
            themes: Array.from(themes).sort()
        };
    }, [data]);

    // Filter Logic
    const filteredData = useMemo(() => {
        if (!data) return null;
        if (selectedDifficulties.length === 0 && selectedGoals.length === 0 && selectedThemes.length === 0) {
            return data;
        }

        const newData: OpeningsResponse = {};

        Object.entries(data).forEach(([category, openings]) => {
            const filteredOpenings = openings.map(opening => {
                const matchingVariations = opening.variations.filter(v => {
                    const matchDiff = selectedDifficulties.length === 0 || (v.difficulty && selectedDifficulties.includes(v.difficulty));
                    const matchGoal = selectedGoals.length === 0 || (v.training_goal && selectedGoals.includes(v.training_goal));
                    const matchTheme = selectedThemes.length === 0 || (v.themes && v.themes.some(t => selectedThemes.includes(t)));

                    return matchDiff && matchGoal && matchTheme;
                });

                if (matchingVariations.length > 0) {
                    return { ...opening, variations: matchingVariations };
                }
                return null;
            }).filter(Boolean) as Opening[];

            if (filteredOpenings.length > 0) {
                newData[category] = filteredOpenings;
            }
        });

        return newData;
    }, [data, selectedDifficulties, selectedGoals, selectedThemes]);

    const toggleFilter = (set: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
        set(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
    };

    const clearFilters = () => {
        setSelectedDifficulties([]);
        setSelectedGoals([]);
        setSelectedThemes([]);
    };

    if (loading) return <div className="flex justify-center p-10 text-slate-400">Loading repertoire...</div>;
    if (!data) return <div className="text-center p-10 text-rose-300">Failed to load openings.</div>;

    const activeFiltersCount = selectedDifficulties.length + selectedGoals.length + selectedThemes.length;

    return (
        <div className="space-y-8">
            <GuestModeBanner isAuthenticated={!!user?.is_authenticated} isLoading={userLoading} />
            <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Opening Repertoire</h1>
                    <p className="text-slate-600 dark:text-slate-400">Explore and learn specific lines.</p>
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={clsx(
                        "flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all border",
                        showFilters || activeFiltersCount > 0
                            ? "bg-indigo-500/20 text-indigo-100 border-indigo-500/40 shadow-inner"
                            : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50 dark:bg-slate-900/60 dark:text-slate-200 dark:border-slate-800 dark:hover:border-slate-700"
                    )}
                >
                    <Filter size={18} />
                    Filters
                    {activeFiltersCount > 0 && (
                        <span className="bg-indigo-500 text-white text-xs rounded-full min-w-[1.75rem] h-7 flex items-center justify-center px-2">
                            {activeFiltersCount}
                        </span>
                    )}
                </button>
            </header>

            {/* Filter Panel */}
            {(showFilters || activeFiltersCount > 0) && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 shadow-2xl shadow-black/40 p-5 space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-white">Filter Variations</h3>
                        {activeFiltersCount > 0 && (
                            <button onClick={clearFilters} className="text-sm text-rose-300 hover:text-rose-200 flex items-center gap-1">
                                <X size={14} /> Clear all
                            </button>
                        )}
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Difficulty */}
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.18em] mb-2 block">Difficulty</label>
                            <div className="flex flex-wrap gap-2">
                                {filterOptions.difficulties.map(diff => (
                                    <button
                                        key={diff}
                                        onClick={() => toggleFilter(setSelectedDifficulties, diff)}
                                        className={clsx(
                                            "px-3 py-1 rounded-full text-xs capitalize transition-colors border",
                                            selectedDifficulties.includes(diff)
                                                ? "bg-indigo-500/20 text-indigo-100 border-indigo-500/30"
                                                : "bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600"
                                        )}
                                    >
                                        {diff}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Goal */}
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.18em] mb-2 block">Goal</label>
                            <div className="flex flex-wrap gap-2">
                                {filterOptions.goals.map(goal => (
                                    <button
                                        key={goal}
                                        onClick={() => toggleFilter(setSelectedGoals, goal)}
                                        className={clsx(
                                            "px-3 py-1 rounded-full text-xs capitalize transition-colors border",
                                            selectedGoals.includes(goal)
                                                ? "bg-indigo-500/20 text-indigo-100 border-indigo-500/30"
                                                : "bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600"
                                        )}
                                    >
                                        {goal}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Themes */}
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.18em] mb-2 block">Themes</label>
                            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
                                {filterOptions.themes.map(theme => (
                                    <button
                                        key={theme}
                                        onClick={() => toggleFilter(setSelectedThemes, theme)}
                                        className={clsx(
                                            "px-3 py-1 rounded-full text-xs capitalize transition-colors border",
                                            selectedThemes.includes(theme)
                                                ? "bg-indigo-500/20 text-indigo-100 border-indigo-500/30"
                                                : "bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600"
                                        )}
                                    >
                                        {theme.replace(/_/g, ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {filteredData && Object.keys(filteredData).length === 0 ? (
                <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-dashed border-slate-700 text-slate-400">
                    <p>No variations match your filters.</p>
                    <button onClick={clearFilters} className="mt-2 text-indigo-200 font-medium hover:text-white">
                        Clear filters
                    </button>
                </div>
            ) : (
                Object.entries(filteredData || {}).map(([category, openings]) => (
                    <section key={category} className="space-y-4">
                        <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2 dark:text-slate-200 dark:border-slate-800">{category}</h2>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {openings.map(opening => (
                                <OpeningCard
                                    key={opening.id}
                                    opening={opening}
                                    inRepertoire={isOpeningInRepertoire(opening)}
                                    onToggleRepertoire={() => toggleOpeningInRepertoire(opening)}
                                    isExpanded={expandedOpening === opening.id}
                                    onToggle={() => setExpandedOpening(curr => curr === opening.id ? null : opening.id)}
                                />
                            ))}
                        </div>
                    </section>
                ))
            )}
        </div>
    );
};

const OpeningCard: React.FC<{
    opening: Opening;
    inRepertoire: boolean;
    onToggleRepertoire: () => void;
    isExpanded: boolean;
    onToggle: () => void;
}> = ({ opening, inRepertoire, onToggleRepertoire, isExpanded, onToggle }) => {
    const progress = opening.progress || { total: 0, completed: 0, percentage: 0 };
    const handleRepertoireClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleRepertoire();
    };

    return (
        <div className={`rounded-2xl border transition-all shadow-xl shadow-black/30 hover:-translate-y-0.5 hover:shadow-2xl focus-within:border-indigo-400/50 focus-within:shadow-indigo-900/30 duration-200 ${isExpanded ? 'border-indigo-500/40 ring-1 ring-indigo-500/40 bg-slate-900/80' : 'border-slate-200 bg-white/90 hover:border-indigo-500/30 dark:border-slate-800 dark:bg-slate-900/70'}`}>
            <div
                role="button"
                tabIndex={0}
                onClick={onToggle}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onToggle();
                    }
                }}
                className="w-full text-left p-4 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 rounded-2xl"
            >
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h3 className={clsx(
                            "font-semibold",
                            isExpanded ? "text-white" : "text-slate-900 dark:text-white"
                        )}>{opening.name}</h3>
                        <div className="flex flex-wrap gap-1 mt-2">
                            {opening.tags.map(tag => (
                                <span
                                    key={tag}
                                    className={clsx(
                                        "px-2 py-0.5 text-xs rounded-full border",
                                        isExpanded
                                            ? "bg-slate-800 text-slate-300 border-slate-700"
                                            : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                                    )}
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleRepertoireClick}
                            className={clsx(
                                "p-2 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70",
                                inRepertoire
                                    ? "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200/70 dark:bg-amber-400/20 dark:text-amber-200 dark:border-amber-300/30"
                                    : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700"
                            )}
                            title={inRepertoire ? "In my repertoire" : "Add to my repertoire"}
                        >
                            <Star
                                className="w-4 h-4"
                                fill={inRepertoire ? "#fcd34d" : "none"}
                            />
                        </button>
                        {isExpanded ? <ChevronUp className="text-slate-400 w-5 h-5" /> : <ChevronDown className="text-slate-400 w-5 h-5" />}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full mt-2">
                    <div className="flex justify-between text-xs text-slate-600 mb-1 dark:text-slate-400">
                        <span>Mastery</span>
                        <span>{progress.completed}/{progress.total} lines ({progress.percentage}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden dark:bg-slate-800">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-300 transition-all duration-500"
                            style={{ width: `${progress.percentage}%` }}
                        />
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="border-t border-slate-800 bg-slate-950/50 p-3 rounded-b-2xl space-y-1">
                    {opening.variations.map(variant => (
                        <VariationItem key={variant.id} variation={variant} openingSlug={opening.id} />
                    ))}
                    {opening.variations.length === 0 && (
                        <p className="text-sm text-slate-500 p-2 italic">No variations match.</p>
                    )}
                </div>
            )}
        </div>
    );
};

const VariationItem: React.FC<{ variation: Variation; openingSlug: string }> = ({ variation, openingSlug }) => {
    const [showMoves, setShowMoves] = useState(false);
    const navigate = useNavigate();

    const handleTrain = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (variation.locked) return;
        navigate(`/train?id=${variation.id}&opening_id=${openingSlug}&mode=review`);
    };

    const handleToggleMoves = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (variation.locked) return;
        setShowMoves(!showMoves);
    };

    return (
        <div className="flex flex-col">
            <div
                className={clsx(
                    "flex items-center justify-between p-2 rounded-lg text-sm group",
                    variation.locked ? "opacity-60 cursor-not-allowed" : "hover:bg-slate-900/70 hover:border-indigo-500/30 border border-transparent"
                )}
            >
                {/* Name Area - Click to Train */}
                <div
                    className={clsx("flex items-center gap-2 flex-1", !variation.locked && "cursor-pointer")}
                    onClick={handleTrain}
                    title={variation.locked ? "This line is Premium" : "Click to Train"}
                >
                    {variation.completed ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                        <Book className="w-4 h-4 text-indigo-200" />
                    )}
                    <div className="flex flex-col">
                        <span className={clsx(
                            "font-medium",
                            variation.completed ? "text-emerald-100" : "text-slate-100",
                            !variation.locked && "group-hover:text-indigo-100"
                        )}>
                            {variation.name}
                        </span>
                        {/* Metadata Chips */}
                        {!variation.locked && (
                            <div className="flex gap-1 mt-0.5">
                                {variation.difficulty && (
                                    <span className="text-[10px] px-1.5 py-px bg-slate-800 text-slate-300 rounded capitalize border border-slate-700">
                                        {variation.difficulty}
                                    </span>
                                )}
                                {variation.training_goal && (
                                    <span className="text-[10px] px-1.5 py-px bg-slate-800 text-slate-300 rounded capitalize border border-slate-700">
                                        {variation.training_goal}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {!variation.locked && (
                        <PlayCircle className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity ml-auto mr-2" />
                    )}
                </div>

                {/* Arrow Area - Click to Expand */}
                <div
                    className={clsx("p-1 rounded hover:bg-slate-800 cursor-pointer", variation.locked && "pointer-events-none")}
                    onClick={handleToggleMoves}
                >
                    {variation.locked ? (
                        <Lock className="w-3 h-3 text-slate-500" />
                    ) : (
                        <ChevronDown className={clsx("w-4 h-4 text-slate-400 transition-transform", showMoves && "rotate-180")} />
                    )}
                </div>
            </div>

            {variation.locked && (
                <div className="mt-2 px-3 py-2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-50 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                        <div className="text-sm font-semibold text-indigo-50">This line is Premium</div>
                        <p className="text-xs text-indigo-100/90 leading-snug">Premium unlocks all lines, making training and drills far more effective.</p>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate('/pricing');
                        }}
                        className="self-center text-xs font-semibold text-indigo-900 bg-white text-center px-3 py-1 rounded-full shadow-sm hover:bg-indigo-50 transition-colors"
                    >
                        Start free trial
                    </button>
                </div>
            )}

            {showMoves && !variation.locked && (
                <div className="pl-8 pr-2 py-2 text-xs text-slate-200 bg-slate-900/60 rounded-b-lg mb-2 border-l-2 border-indigo-500/30 ml-2">
                    <div className="flex flex-wrap gap-1 mb-2">
                        {variation.moves.map((move, i) => (
                            <span key={i} className={clsx(
                                "px-1.5 py-0.5 rounded border",
                                i % 2 === 0 ? "bg-slate-800 text-slate-100 border-slate-700" : "bg-slate-100 text-slate-900 border-slate-200"
                            )}>
                                {move.san}
                            </span>
                        ))}
                    </div>
                    {variation.themes && variation.themes.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-800/60">
                            <span className="text-slate-400 text-[10px] uppercase tracking-wider">Themes:</span>
                            {variation.themes.map(theme => (
                                <span key={theme} className="text-[10px] px-1.5 bg-indigo-500/10 text-indigo-100 rounded capitalize border border-indigo-500/20">
                                    {theme.replace(/_/g, ' ')}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
