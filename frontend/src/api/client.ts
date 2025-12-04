import axios from 'axios';
import type { 
    DashboardResponse, 
    OpeningsResponse, 
    RecallSessionResponse, 
    SubmitResultPayload, 
    SubmitResultResponse 
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

export const api = {
    getDashboard: async () => {
        const { data } = await client.get<DashboardResponse>('/dashboard/');
        return data;
    },
    getOpenings: async () => {
        const { data } = await client.get<OpeningsResponse>('/openings/');
        return data;
    },
    getRecallSession: async (id?: string) => {
        const url = id ? `/recall/session/?id=${id}` : '/recall/session/';
        const { data } = await client.get<RecallSessionResponse>(url);
        return data;
    },
    submitResult: async (payload: SubmitResultPayload) => {
        const { data } = await client.post<SubmitResultResponse>('/submit-result/', payload);
        return data;
    }
};

