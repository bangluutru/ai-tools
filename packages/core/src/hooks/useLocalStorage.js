import { useState, useEffect } from 'react';
import { storage } from '../services/storage';

/**
 * A custom hook that syncs state with localforage (IndexedDB).
 * Auto-migrates from localStorage on first load.
 * @param {string} key - The storage key
 * @param {*} initialValue - The default value if nothing is stored
 * @param {string} namespace - The app namespace for indexeddb
 */
export function useLocalStorage(key, initialValue, namespace = 'core') {
    const [storedValue, setStoredValue] = useState(initialValue);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        let mounted = true;
        async function load() {
            try {
                if (window.localStorage.getItem(key)) {
                    await storage.migrateFromLocalStorage(namespace, [key]);
                }
                const item = await storage.get(namespace, key);
                if (mounted && item !== null) {
                    setStoredValue(item);
                }
            } catch (error) {
                console.error('Error reading storage key:', key, error);
            } finally {
                if (mounted) setIsLoaded(true);
            }
        }
        load();
        return () => { mounted = false; };
    }, [key, namespace]);

    const setValue = async (value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            await storage.set(namespace, key, valueToStore);
        } catch (error) {
            console.error('Error setting storage key:', key, error);
        }
    };

    const removeValue = async () => {
        try {
            setStoredValue(initialValue);
            await storage.remove(namespace, key);
        } catch (error) {
            console.error('Error removing storage key:', key, error);
        }
    };

    return [storedValue, setValue, removeValue, isLoaded];
}
