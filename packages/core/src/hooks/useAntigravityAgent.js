import { useState, useCallback } from 'react';

const configuredApiBase = import.meta.env.VITE_API_BASE_URL?.trim();
const API_BASE = (configuredApiBase || (import.meta.env.DEV ? 'http://localhost:8000' : '')).replace(/\/$/, '');
const AGENT_BASE_PATH = '/api/agents';

function resolveEndpoint(endpoint) {
    const path = endpoint.startsWith('/api/') ? endpoint : `${AGENT_BASE_PATH}${endpoint}`;
    return `${API_BASE}${path}`;
}

export function useAntigravityAgent(endpoint) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    const execute = useCallback(async (payload, forceFormData) => {
        setIsLoading(true);
        setError(null);
        
        try {
            const options = {
                method: 'POST',
            };

            const isFormData = forceFormData ?? payload instanceof FormData;
            if (isFormData) {
                options.body = payload;
                // Don't set Content-Type, browser will set it with boundary automatically for FormData
            } else {
                options.headers = { 'Content-Type': 'application/json' };
                options.body = JSON.stringify(payload);
            }

            const response = await fetch(resolveEndpoint(endpoint), options);
            
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || `Request failed with status ${response.status}`);
            }

            const result = await response.json();
            setData(result);
            return result;
        } catch (err) {
            console.error('Antigravity request failed:', err);
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [endpoint]);

    return { execute, isLoading, error, data };
}
