import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { GuestModeBanner } from '../components/GuestModeBanner';
import { CurriculumProgression } from '../components/CurriculumProgression';
import { useUser } from '../context/UserContext';
import type { DashboardResponse, OpeningsResponse, Opening as ApiOpening, RepertoireResponse, Variation as ApiVariation } from '../types';
import type { Goals, CurriculumUiState, Opening, OpeningProgress, Variation, Difficulty, Side } from '../components/CurriculumProgression/types';
import clsx from 'clsx';
import { AlertTriangle } from 'lucide-react';

function getStringProp(record: Record<string, unknown>, key: string) {
    const value = record[key];
    return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function inferSideFromTags(tags: string[]): Side {
    return tags.includes('Black') ? 'black' : 'white';
}

function clampInt(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, Math.round(value)));
}

function parseDifficulty(value: string | undefined): Difficulty {
    if (value === 'beginner' || value === 'intermediate' || value === 'advanced') return value;
    return 'intermediate';
}

function makeDesignUser(user: DashboardResponse | null, isPremiumUser: boolean) {
    const record = (user ?? {}) as unknown as Record<string, unknown>;
    const displayName =
        getStringProp(record, 'displayName') ??
        getStringProp(record, 'display_name') ??
        getStringProp(record, 'username') ??
        getStringProp(record, 'email') ??
        (user?.is_authenticated ? 'Player' : 'Guest');

    const username =
        getStringProp(record, 'username') ??
        getStringProp(record, 'email') ??
        (user?.is_authenticated ? 'player' : 'guest');

    const avatarUrl = getStringProp(record, 'avatarUrl') ?? getStringProp(record, 'avatar_url') ?? '/vite.svg';

    return {
        id: username,
        displayName,
        username,
        avatarUrl,
        totalXp: typeof user?.xp === 'number' ? user.xp : 0,
        level: typeof user?.level === 'number' ? user.level : 1,
        isPremium: isPremiumUser,
    };
}

function flattenOpenings(data: OpeningsResponse | null): ApiOpening[] {
    if (!data) return [];
    return Object.values(data).flat();
}

function isOpeningInRepertoire(opening: ApiOpening, repertoire: RepertoireResponse | null) {
    if (!repertoire) return false;
    const side = inferSideFromTags(opening.tags);
    return (repertoire[side] || []).some((item) => item.opening_id === opening.id);
}

function makeDesignOpening(opening: ApiOpening): Opening {
    return {
        id: opening.id,
        name: opening.name,
        description: opening.tags.length > 0 ? opening.tags.join(' • ') : 'Opening',
        side: inferSideFromTags(opening.tags),
        eco: '',
        imageUrl: '/vite.svg',
        variationCount: opening.variations.length,
        isPremium: false,
    };
}

function makeDesignVariations(opening: ApiOpening, inRepertoire: boolean, isPremiumUser: boolean): Variation[] {
    return opening.variations.map((v: ApiVariation) => {
        const movesSan = v.moves.map((m) => m.san).join(' ');
        return {
            id: v.id,
            openingId: opening.id,
            name: v.name,
            description: '',
            moves: movesSan,
            moveCount: v.moves.length,
            difficulty: parseDifficulty(v.difficulty),
            isPremium: Boolean(v.locked),
            isLocked: isPremiumUser ? false : Boolean(v.locked),
            isInRepertoire: inRepertoire,
        };
    });
}

function makeDesignOpeningProgress(
    opening: ApiOpening,
    inRepertoire: boolean,
    isPremiumUser: boolean
): OpeningProgress {
    const mastered = Boolean(opening.drill_mode_unlocked);
    const premiumLocked = !isPremiumUser && opening.variations.length > 0 && opening.variations.every((v) => v.locked);

    const progressPercent =
        typeof opening.progress?.percentage === 'number'
            ? clampInt(opening.progress.percentage, 0, 100)
            : 0;

    return {
        openingId: opening.id,
        state: mastered ? 'mastered' : inRepertoire ? 'unlocked' : 'locked',
        masteryPercent: progressPercent,
        xpEarned: 0,
        isInRepertoire: inRepertoire,
        premiumLocked,
        prerequisites: { requiredLevel: 1, requiredOpenings: [] },
        lockReason: premiumLocked
            ? { type: 'premium', message: `Premium required to unlock ${opening.name}.` }
            : null,
        unlockedAt: null,
        masteredAt: null,
    };
}

export const OpeningDrillSelection: React.FC = () => {
    const navigate = useNavigate();
    const { user, loading: userLoading } = useUser();

    const isPremiumUser = Boolean(user?.effective_premium || user?.is_premium || user?.is_superuser || user?.is_staff);

    const [openingsData, setOpeningsData] = useState<OpeningsResponse | null>(null);
    const [repertoire, setRepertoire] = useState<RepertoireResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [goals] = useState<Goals>(() => ({
        dailyReviewTarget: 12,
        staminaCap: 10,
        preferredSide: 'white',
    }));

    // Fixed to 'mastered' filter - this page only shows mastered openings
    const [ui, setUi] = useState<CurriculumUiState>(() => ({
        activeFilter: 'mastered',
        expandedOpeningId: null,
    }));

    useEffect(() => {
        setLoading(true);
        setError(null);
        Promise.all([api.getOpenings(), api.getRepertoire().catch(() => null)])
            .then(([data, repertoireData]) => {
                setOpeningsData(data);
                setRepertoire(repertoireData);
            })
            .catch((err) => {
                console.error(err);
                setError('Failed to load openings.');
            })
            .finally(() => setLoading(false));
    }, []);

    const flattened = useMemo(() => flattenOpenings(openingsData), [openingsData]);

    // Filter to only mastered openings (drill_mode_unlocked === true)
    const masteredOpenings = useMemo(() => {
        return flattened.filter((opening) => opening.drill_mode_unlocked === true);
    }, [flattened]);

    const designUser = useMemo(() => makeDesignUser(user ?? null, isPremiumUser), [user, isPremiumUser]);

    const { openings, openingProgress, variations } = useMemo(() => {
        const openings: Opening[] = [];
        const openingProgress: OpeningProgress[] = [];
        const variations: Variation[] = [];

        for (const opening of masteredOpenings) {
            const inRepertoire = isOpeningInRepertoire(opening, repertoire);
            openings.push(makeDesignOpening(opening));
            openingProgress.push(makeDesignOpeningProgress(opening, inRepertoire, isPremiumUser));
            variations.push(...makeDesignVariations(opening, inRepertoire, isPremiumUser));
        }

        return { openings, openingProgress, variations };
    }, [masteredOpenings, repertoire, isPremiumUser]);

    const startFreeTrial = () => {
        navigate('/pricing');
    };

    const startDrillForOpening = (openingId: string) => {
        navigate(`/train?mode=opening_drill&opening_id=${encodeURIComponent(openingId)}`);
    };

    const startDrillForVariation = (openingId: string, variationId: string) => {
        navigate(
            `/train?mode=opening_drill&opening_id=${encodeURIComponent(openingId)}&variation_id=${encodeURIComponent(variationId)}`
        );
    };

    if (loading || userLoading) {
        return <div className="text-slate-500">Loading…</div>;
    }

    if (error) {
        return (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 mt-0.5" />
                <div className="space-y-1">
                    <div className="font-semibold">Couldn't load openings</div>
                    <div className="text-sm text-rose-800">{error}</div>
                </div>
            </div>
        );
    }

    if (openings.length === 0) {
        return (
            <div className="space-y-4">
                <GuestModeBanner isAuthenticated={Boolean(user?.is_authenticated)} isLoading={userLoading} />
                <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-6 text-center">
                    <h2 className="text-xl font-heading font-bold text-amber-900 dark:text-amber-100 mb-2">
                        No Mastered Openings Yet
                    </h2>
                    <p className="text-amber-800 dark:text-amber-200 mb-4">
                        Complete opening training in the Curriculum to unlock Opening Drill mode.
                    </p>
                    <button
                        onClick={() => navigate('/curriculum')}
                        className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors"
                    >
                        Go to Curriculum
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <GuestModeBanner isAuthenticated={Boolean(user?.is_authenticated)} isLoading={userLoading} />

            {/* Header */}
            <div className="text-center mb-6">
                <h1 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 dark:text-white mb-2">
                    Opening Drill
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                    Select a mastered opening to practice with targeted spaced repetition.
                </p>
            </div>

            <div className={clsx('rounded-2xl overflow-hidden', 'ring-1 ring-inset ring-slate-200/70 dark:ring-slate-800')}>
                <CurriculumProgression
                    user={designUser}
                    openings={openings}
                    openingProgress={openingProgress}
                    variations={variations}
                    goals={goals}
                    ui={ui}
                    isPremium={isPremiumUser}
                    showGoals={false}
                    onChangeFilter={(filter) => setUi((prev) => ({ ...prev, activeFilter: filter }))}
                    onStartOpening={(openingId) => startDrillForOpening(openingId)}
                    onStartVariation={(openingId, variationId) => startDrillForVariation(openingId, variationId)}
                    onSetDailyReviewTarget={() => { }}
                    onSetStaminaCap={() => { }}
                    onSetPreferredSide={() => { }}
                    onStartFreeTrial={startFreeTrial}
                />
            </div>
        </div>
    );
};
