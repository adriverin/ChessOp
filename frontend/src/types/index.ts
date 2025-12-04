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
}

export interface RecallSessionVariation {
    type: 'srs_review' | 'new_learn';
    id: string; // slug
    name: string;
    moves: Move[];
    orientation: 'white' | 'black';
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
}

export type SubmitResultPayload = SubmitVariationPayload | SubmitMistakeFixedPayload | SubmitBlunderPayload;

