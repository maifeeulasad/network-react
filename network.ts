/**
 * A custom React hook for fetching data with advanced features such as retries, 
 * timeout, caching, and debouncing. It provides a convenient way to handle 
 * asynchronous data fetching in React components.
 *
 * @template T - The type of the data expected from the fetch response.
 * 
 * @param {string} url - The URL to fetch data from.
 * @param {UseFetchConfig} [config] - Optional configuration for the fetch request.
 * @param {number} [config.retries=3] - The number of retry attempts in case of failure.
 * @param {number} [config.retryDelay=1000] - The delay (in milliseconds) between retries.
 * @param {number} [config.timeout=5000] - The timeout (in milliseconds) for the fetch request.
 * @param {number} [config.debounceTime=300] - The debounce time (in milliseconds) to delay the fetch call.
 * @param {boolean} [config.useCache=false] - Whether to use caching for the fetched data.
 * @param {RequestInit} [config] - Additional options for the fetch request (e.g., headers, method).
 * 
 * @returns {FetchState<T>} - An object containing the fetch state:
 * - `data` (T | undefined): The fetched data, or `undefined` if not yet available.
 * - `loading` (boolean): Whether the fetch request is currently in progress.
 * - `error` (string | undefined): An error message if the fetch request failed, or `undefined` if no error occurred.
 * - `refetch` (function): A function to manually trigger a refetch of the data.
 * - `abort` (function): A function to abort the ongoing fetch request.
 * 
 * @example
 * ```tsx
 * import React from 'react';
 * import { useFetch } from './network';
 * 
 * const MyComponent = () => {
 *   const { data, loading, error, refetch } = useFetch<MyDataType>('https://api.example.com/data', {
 *     retries: 5,
 *     timeout: 10000,
 *     useCache: true,
 *   });
 * 
 *   if (loading) return <p>Loading...</p>;
 *   if (error) return <p>Error: {error}</p>;
 * 
 *   return (
 *     <div>
 *       <pre>{JSON.stringify(data, null, 2)}</pre>
 *       <button onClick={refetch}>Refetch</button>
 *     </div>
 *   );
 * };
 * ```
 */
import { useState, useEffect, useCallback, useRef } from 'react';

const DEFAULT_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 1000;
const DEFAULT_TIMEOUT = 5000;
const DEFAULT_DEBOUNCE_TIME = 300;
const DEFAULT_USE_CACHE = false;

interface FetchState<T> {
  data?: T;
  loading: boolean;
  error?: string;
  refetch: () => void;
  abort: () => void;
}

interface UseFetchConfig extends RequestInit {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
  debounceTime?: number;
  useCache?: boolean;
}

const cache = new Map<string, any>();

const useFetch = <T>(url: string, config?: UseFetchConfig): FetchState<T> => {
  const {
    retries = DEFAULT_RETRIES,
    retryDelay = DEFAULT_RETRY_DELAY,
    timeout = DEFAULT_TIMEOUT,
    debounceTime = DEFAULT_DEBOUNCE_TIME,
    useCache = DEFAULT_USE_CACHE,
    ...options
  } = config || {};

  const [data, setData] = useState<T | undefined>(useCache ? cache.get(url) : undefined);
  const [loading, setLoading] = useState<boolean>(!useCache || !cache.has(url));
  const [error, setError] = useState<string | undefined>(undefined);
  const controllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutIds = useRef<ReturnType<typeof setTimeout>[]>([]);

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
          timeoutIds.current.push(timeoutId);

          const response = await fetch(url, { ...options, signal });
          clearTimeout(timeoutId);
          timeoutIds.current = timeoutIds.current.filter(id => id !== timeoutId);

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
        } finally {
          setLoading(false);
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
      timeoutIds.current.forEach(clearTimeout);
    };
  }, []);

  const abort = () => {
    controllerRef.current?.abort();
  };

  return { data, loading, error, refetch: fetchData, abort };
};

export { useFetch };
