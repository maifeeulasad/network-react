import { useState, useEffect, useCallback } from 'react';

interface FetchState<T> {
  data?: T;
  loading: boolean;
  error?: string;
  refetch: () => Promise<void>;
}

const useFetch = <T>(url: string, options?: RequestInit, retries: number = 3): FetchState<T> => {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | undefined>(undefined);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(undefined);

    let attempt = 0;
    while (attempt <= retries) {
      try {
        const response = await fetch(url, options);

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
      }
    }
    setLoading(false);
  }, [url, options, retries]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

export { useFetch };