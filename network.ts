import { useState, useEffect, useCallback, useRef } from 'react';

interface FetchState<T> {
  data?: T;
  loading: boolean;
  error?: string;
  refetch: () => void;
  abort: () => void;
}

const cache = new Map<string, any>();

const useFetch = <T>(
  url: string,
  options?: RequestInit,
  retries: number = 3,
  retryDelay: number = 1000,
  timeout: number = 5000,
  useCache: boolean = true,
  debounceTime: number = 300
): FetchState<T> => {
  const [data, setData] = useState<T | undefined>(useCache ? cache.get(url) : undefined);
  const [loading, setLoading] = useState<boolean>(!useCache || !cache.has(url));
  const [error, setError] = useState<string | undefined>(undefined);
  const controllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      if (useCache && cache.has(url)) {
        setData(cache.get(url));
        setLoading(false);
        return;
      }

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
          if (useCache) {
            cache.set(url, result);
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
        }
      }
      setLoading(false);
    }, debounceTime);
  }, [url, options, retries, retryDelay, timeout, useCache, debounceTime]);

  useEffect(() => {
    fetchData();
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      controllerRef.current?.abort();
    };
  }, [fetchData]);

  const abort = () => {
    controllerRef.current?.abort();
  };

  return { data, loading, error, refetch: fetchData, abort };
};

export { useFetch };
