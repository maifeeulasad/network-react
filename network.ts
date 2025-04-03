import { useState, useEffect, useCallback, useRef } from 'react';

interface FetchState<T> {
  data?: T;
  loading: boolean;
  error?: string;
  refetch: () => Promise<void>;
  abort: () => void;
}

const useFetch = <T>(url: string, options?: RequestInit, retries: number = 3, retryDelay: number = 1000, timeout: number = 5000): FetchState<T> => {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const controllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(undefined);

    let attempt = 0;
    while (attempt <= retries) {
      try {
        if (controllerRef.current) {
          controllerRef.current.abort();
        }
        
        const controller = new AbortController();
        controllerRef.current = controller;
        const signal = controller.signal;
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, { ...options, signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        const result: T = await response.json();
        setData(result);
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
      }
    }
    setLoading(false);
  }, [url, options, retries, retryDelay, timeout]);

  useEffect(() => {
    fetchData();
    return () => controllerRef.current?.abort();
  }, [fetchData]);

  const abort = () => {
    controllerRef.current?.abort();
  };

  return { data, loading, error, refetch: fetchData, abort };
};

export { useFetch };
