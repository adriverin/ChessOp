import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { OpeningsResponse, Opening, Variation, RepertoireResponse } from '../types';
import { Lock, ChevronDown, ChevronUp, Book, Check, PlayCircle, Filter, X, Star } from 'lucide-react';
import clsx from 'clsx';

export const Openings: React.FC = () => {
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

    if (loading) return <div className="flex justify-center p-10">Loading repertoire...</div>;
    if (!data) return <div className="text-center p-10 text-red-500">Failed to load openings.</div>;

    const activeFiltersCount = selectedDifficulties.length + selectedGoals.length + selectedThemes.length;

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Opening Repertoire</h1>
                    <p className="text-gray-500">Explore and learn specific lines.</p>
                </div>
                <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={clsx(
                        "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                        showFilters || activeFiltersCount > 0 
                            ? "bg-blue-50 text-blue-700 border border-blue-200" 
                            : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                    )}
                >
                    <Filter size={18} />
                    Filters
                    {activeFiltersCount > 0 && (
                        <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {activeFiltersCount}
                        </span>
                    )}
                </button>
            </header>

            {/* Filter Panel */}
            {(showFilters || activeFiltersCount > 0) && (
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-gray-800">Filter Variations</h3>
                        {activeFiltersCount > 0 && (
                            <button onClick={clearFilters} className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1">
                                <X size={14} /> Clear all
                            </button>
                        )}
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Difficulty */}
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Difficulty</label>
                            <div className="flex flex-wrap gap-2">
                                {filterOptions.difficulties.map(diff => (
                                    <button
                                        key={diff}
                                        onClick={() => toggleFilter(setSelectedDifficulties, diff)}
                                        className={clsx(
                                            "px-3 py-1 rounded-full text-xs capitalize transition-colors border",
                                            selectedDifficulties.includes(diff)
                                                ? "bg-blue-100 text-blue-800 border-blue-200"
                                                : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                                        )}
                                    >
                                        {diff}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Goal */}
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Goal</label>
                            <div className="flex flex-wrap gap-2">
                                {filterOptions.goals.map(goal => (
                                    <button
                                        key={goal}
                                        onClick={() => toggleFilter(setSelectedGoals, goal)}
                                        className={clsx(
                                            "px-3 py-1 rounded-full text-xs capitalize transition-colors border",
                                            selectedGoals.includes(goal)
                                                ? "bg-purple-100 text-purple-800 border-purple-200"
                                                : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                                        )}
                                    >
                                        {goal}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Themes */}
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Themes</label>
                            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                                {filterOptions.themes.map(theme => (
                                    <button
                                        key={theme}
                                        onClick={() => toggleFilter(setSelectedThemes, theme)}
                                        className={clsx(
                                            "px-3 py-1 rounded-full text-xs capitalize transition-colors border",
                                            selectedThemes.includes(theme)
                                                ? "bg-green-100 text-green-800 border-green-200"
                                                : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
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
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <p className="text-gray-500">No variations match your filters.</p>
                    <button onClick={clearFilters} className="mt-2 text-blue-600 font-medium hover:underline">
                        Clear filters
                    </button>
                </div>
            ) : (
                Object.entries(filteredData || {}).map(([category, openings]) => (
                    <section key={category} className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">{category}</h2>
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
        <div className={`bg-white rounded-lg shadow-sm border transition-all ${isExpanded ? 'border-blue-300 ring-1 ring-blue-100' : 'border-gray-200 hover:border-blue-200'}`}>
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
                className="w-full text-left p-4 cursor-pointer outline-none focus:ring-2 focus:ring-blue-200 rounded-lg"
            >
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h3 className="font-bold text-gray-900">{opening.name}</h3>
                        <div className="flex flex-wrap gap-1 mt-2">
                            {opening.tags.map(tag => (
                                <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleRepertoireClick}
                            className={clsx(
                                "p-2 rounded-full border transition-colors",
                                inRepertoire
                                    ? "bg-yellow-50 border-yellow-200 text-yellow-500"
                                    : "bg-white border-gray-200 text-gray-400 hover:bg-gray-100"
                            )}
                            title={inRepertoire ? "In my repertoire" : "Add to my repertoire"}
                        >
                            <Star
                                className="w-4 h-4"
                                fill={inRepertoire ? "#facc15" : "none"}
                            />
                        </button>
                        {isExpanded ? <ChevronUp className="text-gray-400 w-5 h-5" /> : <ChevronDown className="text-gray-400 w-5 h-5" />}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full mt-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Mastery</span>
                        <span>{progress.completed}/{progress.total} lines ({progress.percentage}%)</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-green-500 transition-all duration-500"
                            style={{ width: `${progress.percentage}%` }}
                        />
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50 p-2 rounded-b-lg space-y-1">
                    {opening.variations.map(variant => (
                        <VariationItem key={variant.id} variation={variant} openingSlug={opening.id} />
                    ))}
                    {opening.variations.length === 0 && (
                        <p className="text-sm text-gray-400 p-2 italic">No variations match.</p>
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
                    "flex items-center justify-between p-2 rounded text-sm group",
                    variation.locked ? "opacity-60 cursor-not-allowed" : "hover:bg-white hover:shadow-sm"
                )}
            >
                {/* Name Area - Click to Train */}
                <div 
                    className={clsx("flex items-center gap-2 flex-1", !variation.locked && "cursor-pointer")}
                    onClick={handleTrain}
                    title={variation.locked ? "Locked" : "Click to Train"}
                >
                    {variation.completed ? (
                        <Check className="w-4 h-4 text-green-500" />
                    ) : (
                        <Book className="w-4 h-4 text-blue-400" />
                    )}
                    <div className="flex flex-col">
                        <span className={clsx(
                            "font-medium", 
                            variation.completed ? "text-green-700" : "text-gray-700",
                            !variation.locked && "group-hover:text-blue-600"
                        )}>
                            {variation.name}
                        </span>
                        {/* Metadata Chips */}
                        {!variation.locked && (
                            <div className="flex gap-1 mt-0.5">
                                {variation.difficulty && (
                                    <span className="text-[10px] px-1.5 py-px bg-gray-100 text-gray-500 rounded capitalize">
                                        {variation.difficulty}
                                    </span>
                                )}
                                {variation.training_goal && (
                                    <span className="text-[10px] px-1.5 py-px bg-gray-100 text-gray-500 rounded capitalize">
                                        {variation.training_goal}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {!variation.locked && (
                        <PlayCircle className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity ml-auto mr-2" />
                    )}
                </div>

                {/* Arrow Area - Click to Expand */}
                <div 
                    className={clsx("p-1 rounded hover:bg-gray-200 cursor-pointer", variation.locked && "pointer-events-none")}
                    onClick={handleToggleMoves}
                >
                    {variation.locked ? (
                        <Lock className="w-3 h-3 text-gray-400" />
                    ) : (
                        <ChevronDown className={clsx("w-4 h-4 text-gray-400 transition-transform", showMoves && "rotate-180")} />
                    )}
                </div>
            </div>
            
            {showMoves && !variation.locked && (
                <div className="pl-8 pr-2 py-2 text-xs text-gray-600 bg-white/50 rounded-b mb-2 border-l-2 border-blue-100 ml-2">
                    <div className="flex flex-wrap gap-1 mb-2">
                        {variation.moves.map((move, i) => (
                            <span key={i} className={clsx(
                                "px-1.5 py-0.5 rounded",
                                i % 2 === 0 ? "bg-white border border-gray-200 text-gray-800" : "bg-gray-800 text-gray-100"
                            )}>
                                {move.san}
                            </span>
                        ))}
                    </div>
                    {variation.themes && variation.themes.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1 border-t border-gray-100">
                            <span className="text-gray-400 text-[10px] uppercase tracking-wider">Themes:</span>
                            {variation.themes.map(theme => (
                                <span key={theme} className="text-[10px] px-1.5 bg-blue-50 text-blue-600 rounded capitalize">
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
