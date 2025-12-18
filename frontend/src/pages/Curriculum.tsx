import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { GuestModeBanner } from '../components/GuestModeBanner';
import { CurriculumProgression } from '../components/CurriculumProgression';
import { useUser } from '../context/UserContext';
import type { DashboardResponse, OpeningsResponse, Opening as ApiOpening, RepertoireResponse, Variation as ApiVariation } from '../types';
import type { Goals, CurriculumUiState, Opening, OpeningProgress, Variation, Difficulty } from '../components/CurriculumProgression/types';
import clsx from 'clsx';
import { AlertTriangle } from 'lucide-react';
import type { Side } from '../components/CurriculumProgression/types';

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

function readJson<T>(key: string): T | null {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

function writeJson(key: string, value: unknown) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // ignore storage errors (private mode, etc.)
    }
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

function makeDesignVariations(opening: ApiOpening, inRepertoire: boolean): Variation[] {
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
            isLocked: Boolean(v.locked),
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

const GOALS_STORAGE_KEY = 'curriculumProgression.goals';
const UI_STORAGE_KEY = 'curriculumProgression.ui';

export const Curriculum: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // User comes from global provider (me + dashboard merged)
    const { user, loading: userLoading } = useUser();

    const isPremiumUser = Boolean(user?.effective_premium || user?.is_premium || user?.is_superuser || user?.is_staff);
    const isGuestUser = !user?.is_authenticated;

    const [openingsData, setOpeningsData] = useState<OpeningsResponse | null>(null);
    const [repertoire, setRepertoire] = useState<RepertoireResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [goals, setGoals] = useState<Goals>(() => {
        const stored = readJson<Goals>(GOALS_STORAGE_KEY);
        return (
            stored ?? {
                dailyReviewTarget: 12,
                staminaCap: 10,
                preferredSide: 'white',
            }
        );
    });

    const [ui, setUi] = useState<CurriculumUiState>(() => {
        const stored = readJson<CurriculumUiState>(UI_STORAGE_KEY);
        return stored ?? { activeFilter: 'all', expandedOpeningId: null };
    });

    useEffect(() => {
        writeJson(GOALS_STORAGE_KEY, goals);
    }, [goals]);

    useEffect(() => {
        writeJson(UI_STORAGE_KEY, ui);
    }, [ui]);

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
                setError('Failed to load curriculum.');
            })
            .finally(() => setLoading(false));
    }, []);

    const flattened = useMemo(() => flattenOpenings(openingsData), [openingsData]);

    const designUser = useMemo(() => makeDesignUser(user ?? null, isPremiumUser), [user, isPremiumUser]);

    const { openings, openingProgress, variations } = useMemo(() => {
        const openings: Opening[] = [];
        const openingProgress: OpeningProgress[] = [];
        const variations: Variation[] = [];

        for (const opening of flattened) {
            const inRepertoire = isOpeningInRepertoire(opening, repertoire);
            openings.push(makeDesignOpening(opening));
            openingProgress.push(makeDesignOpeningProgress(opening, inRepertoire, isPremiumUser));
            variations.push(...makeDesignVariations(opening, inRepertoire));
        }

        return { openings, openingProgress, variations };
    }, [flattened, repertoire, isPremiumUser]);

    const openSignupModal = () => {
        navigate('/signup', {
            replace: false,
            state: { backgroundLocation: location, from: location },
        });
    };

    const startFreeTrial = () => {
        navigate('/pricing');
    };

    const startReviewForOpening = (openingId: string) => {
        navigate(`/train?mode=review&opening_id=${encodeURIComponent(openingId)}`);
    };

    const unlockOpening = async (openingId: string) => {
        if (!user?.is_authenticated) {
            openSignupModal();
            return;
        }
        try {
            const updated = await api.toggleRepertoire(openingId, true);
            setRepertoire(updated);
        } catch (err: unknown) {
            const record = err as { response?: { status?: number } };
            if (record.response?.status === 403) {
                alert('Upgrade to add this opening to your repertoire.');
                navigate('/pricing');
                return;
            }
            alert('Could not unlock this opening. Please try again.');
        }
    };

    if (loading || userLoading) {
        return <div className="text-slate-500">Loading…</div>;
    }

    if (error) {
        return (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 mt-0.5" />
                <div className="space-y-1">
                    <div className="font-semibold">Couldn’t load curriculum</div>
                    <div className="text-sm text-rose-800">{error}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <GuestModeBanner isAuthenticated={Boolean(user?.is_authenticated)} isLoading={userLoading} />

            <div className={clsx('rounded-2xl overflow-hidden', 'ring-1 ring-inset ring-slate-200/70 dark:ring-slate-800')}>
                <CurriculumProgression
                    user={designUser}
                    openings={openings}
                    openingProgress={openingProgress}
                    variations={variations}
                    userProgress={[]}
                    goals={goals}
                    ui={ui}
                    isGuest={isGuestUser}
                    isPremium={isPremiumUser}
                    onChangeFilter={(filter) => setUi((prev) => ({ ...prev, activeFilter: filter }))}
                    onToggleExpandedOpening={(openingId) => setUi((prev) => ({ ...prev, expandedOpeningId: openingId }))}
                    onUnlockOpening={(openingId) => void unlockOpening(openingId)}
                    onStartReview={(openingId) => startReviewForOpening(openingId)}
                    onSetDailyReviewTarget={(target) =>
                        setGoals((prev) => ({ ...prev, dailyReviewTarget: clampInt(target, 1, 50) }))
                    }
                    onSetStaminaCap={(cap) => setGoals((prev) => ({ ...prev, staminaCap: clampInt(cap, 1, 20) }))}
                    onSetPreferredSide={(side) => setGoals((prev) => ({ ...prev, preferredSide: side }))}
                    onStartFreeTrial={startFreeTrial}
                    onSignUp={openSignupModal}
                />
            </div>
        </div>
    );
};
