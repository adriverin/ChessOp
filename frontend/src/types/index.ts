export interface Quest {
    title: string;
    description: string;
    progress: number;
    target: number;
    completed: boolean;
    reward: number;
}

export interface DashboardResponse {
    is_authenticated: boolean;
    xp?: number;
    level?: number;
    is_premium?: boolean;
    effective_premium?: boolean;
    is_superuser?: boolean;
    is_staff?: boolean;
    quests?: Quest[];
}

export interface Move {
    san: string;
    desc: string;
}

export interface Variation {
    id: string; // slug
    name: string;
    locked: boolean;
    moves: Move[];
    completed?: boolean;
    difficulty?: string;
    training_goal?: string;
    themes?: string[];
}

export interface Opening {
    id: string;
    name: string;
    tags: string[];
    variations: Variation[];
    progress?: {
        total: number;
        completed: number;
        percentage: number;
    };
    drill_mode_unlocked?: boolean;
}

export interface RepertoireOpening {
    opening_id: string;
    name: string;
    side: 'white' | 'black';
}

export interface RepertoireResponse {
    white: RepertoireOpening[];
    black: RepertoireOpening[];
}

export interface OpeningDrillResponse {
    opening: {
        id: string;
        name: string;
    };
    variation: {
        id: string;
        moves: Move[];
        orientation: 'white' | 'black';
    };
    srs: OpeningDrillSRSData;
}

export interface OpeningDrillSRSData {
    interval_days: number;
    ease_factor: number;
    streak: number;
    due_date: string | null;
    status: 'learning' | 'due' | 'mastered';
}

export interface OpeningDrillProgressItem {
    variation_id: string;
    line_number: number;
    interval_days: number;
    ease_factor: number;
    streak: number;
    due_date: string | null;
    status: 'learning' | 'due' | 'mastered';
}

export interface OpeningDrillProgressResponse {
    opening: {
        id: string;
        name: string;
    };
    progress: OpeningDrillProgressItem[];
}

export interface OpeningsResponse {
    [category: string]: Opening[];
}

export type SessionType = 'mistake' | 'srs_review' | 'new_learn';

export interface RecallSessionMistake {
    type: 'mistake';
    id: number;
    fen: string;
    wrong_move: string;
    correct_move: string;
    variation_name: string;
    orientation: 'white' | 'black';
    difficulty?: string;
    training_goal?: string;
    themes?: string[];
    opening?: {
        slug: string;
        name: string;
    };
}

export interface RecallSessionVariation {
    type: 'srs_review' | 'new_learn';
    id: string; // slug
    name: string;
    moves: Move[];
    orientation: 'white' | 'black';
    difficulty?: string;
    training_goal?: string;
    themes?: string[];
    opening?: {
        slug: string;
        name: string;
    };
}

export type RecallSessionResponse = RecallSessionMistake | RecallSessionVariation;

export interface SubmitResultResponse {
    success: boolean;
    message: string;
    error?: string;
}

export interface SubmitVariationPayload {
    type: 'variation_complete';
    id: string;
    hint_used?: boolean;
    mode?: 'opening_drill';
}

export interface SubmitMistakeFixedPayload {
    type: 'mistake_fixed';
    mistake_id: number;
    hint_used?: boolean;
}

export interface SubmitBlunderPayload {
    type: 'blunder_made';
    id: string;
    fen: string;
    wrong_move: string;
    correct_move: string;
    mode?: 'opening_drill' | 'one_move';
}

export interface SubmitOneMoveCompletePayload {
    type: 'one_move_complete';
    success: boolean;
    mode?: 'one_move';
}

export type SubmitResultPayload =
    | SubmitVariationPayload
    | SubmitMistakeFixedPayload
    | SubmitBlunderPayload
    | SubmitOneMoveCompletePayload;

export interface ThemeStat {
    name: string;
    attempts: number;
    successes: number;
    accuracy: number;
}

export interface ThemeStatsResponse {
    themes: ThemeStat[];
}

export interface RecallFilters {
    difficulties?: string[];
    training_goals?: string[];
    themes?: string[];
    opening_id?: string;
    use_repertoire_only?: boolean;
}
