import axios from 'axios';
import type { 
    DashboardResponse, 
    OpeningsResponse, 
    RecallSessionResponse, 
    SubmitResultPayload, 
    SubmitResultResponse,
    ThemeStatsResponse,
    OpeningDrillResponse,
    OpeningDrillProgressResponse
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
    getRecallSession: async (id?: string, filters?: RecallFilters) => {
        let url = '/recall/session/';
        const params = new URLSearchParams();
        
        if (id) {
            params.append('id', id);
        }
        
        if (filters) {
            if (filters.difficulties && filters.difficulties.length > 0) {
                params.append('difficulties', filters.difficulties.join(','));
            }
            if (filters.training_goals && filters.training_goals.length > 0) {
                params.append('training_goals', filters.training_goals.join(','));
            }
            if (filters.themes && filters.themes.length > 0) {
                params.append('themes', filters.themes.join(','));
            }
        }
        
        const queryString = params.toString();
        if (queryString) {
            url += `?${queryString}`;
        }
        
        const { data } = await client.get<RecallSessionResponse>(url);
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
    }
};
