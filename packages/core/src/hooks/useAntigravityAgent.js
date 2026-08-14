import { useState, useCallback } from 'react';

const API_BASE = 'http://localhost:8000'; // Default FastAPI port

export function useAntigravityAgent(endpoint) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    const execute = useCallback(async (payload, isFormData = false) => {
        setIsLoading(true);
        setError(null);
        
        try {
            const options = {
                method: 'POST',
            };

            if (isFormData) {
                options.body = payload;
                // Don't set Content-Type, browser will set it with boundary automatically for FormData
            } else {
                options.headers = { 'Content-Type': 'application/json' };
                options.body = JSON.stringify(payload);
            }

            const response = await fetch(`${API_BASE}${endpoint}`, options);
            
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || `Request failed with status ${response.status}`);
            }

            const result = await response.json();
            setData(result);
            return result;
        } catch (err) {
            console.error('Antigravity API Error:', err);
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [endpoint]);

    return { execute, isLoading, error, data };
}
