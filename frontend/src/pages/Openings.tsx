import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { OpeningsResponse, Opening, Variation } from '../types';
import { Lock, ChevronDown, ChevronUp, Book, Check, PlayCircle } from 'lucide-react';
import clsx from 'clsx';

export const Openings: React.FC = () => {
    const [data, setData] = useState<OpeningsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedOpening, setExpandedOpening] = useState<string | null>(null);

    useEffect(() => {
        api.getOpenings()
            .then(setData)
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex justify-center p-10">Loading repertoire...</div>;
    if (!data) return <div className="text-center p-10 text-red-500">Failed to load openings.</div>;

    const toggleOpening = (id: string) => {
        setExpandedOpening(curr => curr === id ? null : id);
    };

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-2xl font-bold text-gray-900">Opening Repertoire</h1>
                <p className="text-gray-500">Explore and learn specific lines.</p>
            </header>

            {Object.entries(data).map(([category, openings]) => (
                <section key={category} className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">{category}</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {openings.map(opening => (
                            <OpeningCard 
                                key={opening.id} 
                                opening={opening} 
                                isExpanded={expandedOpening === opening.id}
                                onToggle={() => toggleOpening(opening.id)}
                            />
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
};

const OpeningCard: React.FC<{ 
    opening: Opening; 
    isExpanded: boolean; 
    onToggle: () => void; 
}> = ({ opening, isExpanded, onToggle }) => {
    const progress = opening.progress || { total: 0, completed: 0, percentage: 0 };

    return (
        <div className={`bg-white rounded-lg shadow-sm border transition-all ${isExpanded ? 'border-blue-300 ring-1 ring-blue-100' : 'border-gray-200 hover:border-blue-200'}`}>
            <button 
                onClick={onToggle}
                className="w-full text-left p-4"
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
                    {isExpanded ? <ChevronUp className="text-gray-400 w-5 h-5" /> : <ChevronDown className="text-gray-400 w-5 h-5" />}
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
            </button>

            {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50 p-2 rounded-b-lg space-y-1">
                    {opening.variations.map(variant => (
                        <VariationItem key={variant.id} variation={variant} />
                    ))}
                    {opening.variations.length === 0 && (
                        <p className="text-sm text-gray-400 p-2 italic">No variations added yet.</p>
                    )}
                </div>
            )}
        </div>
    );
};

const VariationItem: React.FC<{ variation: Variation }> = ({ variation }) => {
    const [showMoves, setShowMoves] = useState(false);
    const navigate = useNavigate();

    const handleTrain = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (variation.locked) return;
        navigate(`/train?id=${variation.id}`);
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
                    <span className={clsx(
                        "font-medium", 
                        variation.completed ? "text-green-700" : "text-gray-700",
                        !variation.locked && "group-hover:text-blue-600"
                    )}>
                        {variation.name}
                    </span>
                    {!variation.locked && (
                        <PlayCircle className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
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
                    <div className="flex flex-wrap gap-1">
                        {variation.moves.map((move, i) => (
                            <span key={i} className={clsx(
                                "px-1.5 py-0.5 rounded",
                                i % 2 === 0 ? "bg-white border border-gray-200 text-gray-800" : "bg-gray-800 text-gray-100"
                            )}>
                                {move.san}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

