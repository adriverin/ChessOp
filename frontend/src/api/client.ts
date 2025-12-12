import axios from 'axios';
import type {
    DashboardResponse,
    OpeningsResponse,
    RecallSessionResponse,
    SubmitResultPayload,
    SubmitResultResponse,
    ThemeStatsResponse,
    OpeningDrillResponse,
    OpeningDrillProgressResponse,
} from '../types';

// Function to get CSRF token from cookies
function getCookie(name: string) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

const client = axios.create({
    baseURL: '/api', // Proxied by Vite
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Add CSRF token to requests
client.interceptors.request.use(config => {
    const csrftoken = getCookie('csrftoken');
    if (csrftoken) {
        config.headers['X-CSRFToken'] = csrftoken;
    }
    return config;
});

export interface RecallFilters {
    difficulties?: string[];
    training_goals?: string[];
    themes?: string[];
    opening_id?: string;
    use_repertoire_only?: boolean;
    side?: 'white' | 'black';
    mode?: 'one_move' | 'review' | string;
    t?: number | string;
}

export interface RepertoireOpening {
    opening_id: string;
    name: string;
    side: "white" | "black";
}

export interface RepertoireResponse {
    white: RepertoireOpening[];
    black: RepertoireOpening[];
}

export interface OpeningDrillOpening {
    id: number;
    slug: string;
    name: string;
    drill_unlocked: boolean;
}

export interface OpeningDrillOpeningsResponse {
    openings: OpeningDrillOpening[];
}

export interface OpeningDrillBadge {
    id: string;
    name: string;
    description: string;
    earned: boolean;
}

export interface OpeningDrillStats {
    total_variations: number;
    mastered_variations: number;
    due_count: number;
    learning_count: number;
    reviews_today: number;
    reviews_last_7_days: number;
    current_flawless_streak: number;
    longest_flawless_streak: number;
    mastery_percentage: number; // 0–1
}

export interface OpeningDrillStatsResponse {
    opening: {
        id: number | string;
        slug?: string;
        name: string;
    };
    stats: OpeningDrillStats;
    badges: OpeningDrillBadge[];
}

export const api = {
    getDashboard: async () => {
        const { data } = await client.get<DashboardResponse>('/dashboard/');
        return data;
    },
    getOpenings: async () => {
        const { data } = await client.get<OpeningsResponse>('/openings/');
        return data;
    },
    getRecallSession: async (id?: string, filters?: RecallFilters, openingId?: string) => {
        let url = '/recall/session/';
        const params = new URLSearchParams();
        
        if (id) {
            params.append('id', id);
        }

        const effectiveFilters = {
            ...filters,
            opening_id: filters?.opening_id || openingId
        };
        
        if (effectiveFilters) {
            if (effectiveFilters.difficulties && effectiveFilters.difficulties.length > 0) {
                params.append('difficulties', effectiveFilters.difficulties.join(','));
            }
            if (effectiveFilters.training_goals && effectiveFilters.training_goals.length > 0) {
                params.append('training_goals', effectiveFilters.training_goals.join(','));
            }
            if (effectiveFilters.themes && effectiveFilters.themes.length > 0) {
                params.append('themes', effectiveFilters.themes.join(','));
            }
            if (effectiveFilters.opening_id) {
                params.append('opening_id', effectiveFilters.opening_id);
            }
            if (typeof effectiveFilters.use_repertoire_only === 'boolean') {
                params.append('use_repertoire_only', String(effectiveFilters.use_repertoire_only));
            }
            if (effectiveFilters.side) {
                params.append('side', effectiveFilters.side);
            }
            if (effectiveFilters.mode) {
                params.append('mode', String(effectiveFilters.mode));
            }
            if (effectiveFilters.t !== undefined && effectiveFilters.t !== null) {
                params.append('t', String(effectiveFilters.t));
            }
        }
        
        const queryString = params.toString();
        if (queryString) {
            url += `?${queryString}`;
        }
        
        const { data } = await client.get<RecallSessionResponse>(url);
        return data;
    },
    getRepertoire: async () => {
        const { data } = await client.get<RepertoireResponse>('/repertoire/');
        return data;
    },
    toggleRepertoire: async (openingId: string, active: boolean) => {
        const { data } = await client.post<RepertoireResponse>('/repertoire/toggle/', {
            opening_id: openingId,
            active
        });
        return data;
    },
    submitResult: async (payload: SubmitResultPayload) => {
        const { data } = await client.post<SubmitResultResponse>('/submit-result/', payload);
        return data;
    },
    getThemeStats: async () => {
        const { data } = await client.get<ThemeStatsResponse>('/stats/themes/');
        return data;
    },
    getOpeningDrillOpenings: async () => {
        const { data } = await client.get<OpeningDrillOpeningsResponse>('/opening-drill/openings/');
        return data;
    },
    getOpeningDrillProgress: async (openingId: string) => {
        const { data } = await client.get<OpeningDrillProgressResponse>('/opening-drill/progress/', {
            params: { opening_id: openingId }
        });
        return data;
    },
    getOpeningDrillSession: async (openingId?: string) => {
        let url = '/opening-drill/session/';
        if (openingId) {
            url += `?opening_id=${openingId}`;
        }
        const { data } = await client.get<OpeningDrillResponse>(url);
        return data;
    },
    getOpeningDrillStats: async (openingId: string | number) => {
        const { data } = await client.get<OpeningDrillStatsResponse>("/opening-drill/stats/", { params: { opening_id: openingId } });
        return data;
    },
    
    // Auth
    signup: async (payload: any) => {
        const { data } = await client.post('/auth/signup/', payload);
        return data;
    },
    login: async (payload: { identifier?: string, email?: string, password: string }) => {
        const { data } = await client.post('/auth/login/', payload);
        return data;
    },
    logout: async () => {
        const { data } = await client.post('/auth/logout/');
        return data;
    },
    me: async () => {
        const { data } = await client.get('/auth/me/');
        return data;
    }
};
