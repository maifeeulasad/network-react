import { useState, useEffect, useCallback, useRef } from 'react';

const DEFAULT_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 1000;
const DEFAULT_TIMEOUT = 5000;
const DEFAULT_DEBOUNCE_TIME = 300;
const DEFAULT_USE_CACHE = false;

interface GraphQLConfig {
    variables?: Record<string, any>;
    retries?: number;
    retryDelay?: number;
    timeout?: number;
    debounceTime?: number;
    useCache?: boolean;
    headers?: HeadersInit;
}

interface GraphQLResponse<T> {
    data?: T;
    loading: boolean;
    error?: string;
    refetch: () => void;
    abort: () => void;
}

const cache = new Map<string, any>();

export const useGraphQL = <T>(
    url: string,
    query: string,
    config?: GraphQLConfig
): GraphQLResponse<T> => {
    const {
        variables = {},
        retries = DEFAULT_RETRIES,
        retryDelay = DEFAULT_RETRY_DELAY,
        timeout = DEFAULT_TIMEOUT,
        debounceTime = DEFAULT_DEBOUNCE_TIME,
        useCache = DEFAULT_USE_CACHE,
        headers = { 'Content-Type': 'application/json' }
    } = config || {};

    const cacheKey = JSON.stringify({ url, query, variables });
    const [data, setData] = useState<T | undefined>(useCache ? cache.get(cacheKey) : undefined);
    const [loading, setLoading] = useState<boolean>(!useCache || !cache.has(cacheKey));
    const [error, setError] = useState<string | undefined>(undefined);
    const controllerRef = useRef<AbortController | null>(null);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const timeoutIds = useRef<ReturnType<typeof setTimeout>[]>([]);

    const fetchData = useCallback(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(async () => {
            if (useCache && cache.has(cacheKey)) {
                setData(cache.get(cacheKey));
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(undefined);

            let attempt = 0;
            while (attempt <= retries) {
                try {
                    controllerRef.current?.abort();
                    const controller = new AbortController();
                    controllerRef.current = controller;
                    const signal = controller.signal;
                    const timeoutId = setTimeout(() => controller.abort(), timeout);
                    timeoutIds.current.push(timeoutId);

                    const response = await fetch(url, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({ query, variables }),
                        signal
                    });

                    clearTimeout(timeoutId);
                    timeoutIds.current = timeoutIds.current.filter(id => id !== timeoutId);

                    if (!response.ok) {
                        throw new Error(`Error: ${response.status} ${response.statusText}`);
                    }

                    const json = await response.json();
                    if (json.errors) {
                        throw new Error(json.errors.map((e: any) => e.message).join('; '));
                    }

                    setData(json.data);
                    if (useCache) {
                        cache.set(cacheKey, json.data);
                    }
                    setError(undefined);
                    return;
                } catch (err) {
                    if (err instanceof Error) {
                        setError(err.message);
                    } else {
                        setError('An unknown error occurred');
                    }
                    attempt++;
                    if (attempt > retries) break;
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                } finally {
                    setLoading(false);
                }
            }
        }, debounceTime);
    }, [url, query, JSON.stringify(variables), retries, retryDelay, timeout, useCache, debounceTime]);

    useEffect(() => {
        fetchData();
        return () => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            controllerRef.current?.abort();
            timeoutIds.current.forEach(clearTimeout);
        };
    }, []);

    const abort = () => {
        controllerRef.current?.abort();
    };

    return { data, loading, error, refetch: fetchData, abort };
};
