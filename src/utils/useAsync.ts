import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from './errors';

export interface AsyncState<T> {
  data: T | undefined;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  reload: () => Promise<void>;
  refresh: () => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<T | undefined>>;
}

/**
 * Runs an async loader on mount (and whenever `deps` change) and tracks
 * loading / error / data. `refresh` is meant for pull-to-refresh.
 */
export function useAsync<T>(
  loader: () => Promise<T>,
  deps: React.DependencyList = [],
): AsyncState<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(async (mode: 'load' | 'refresh') => {
    if (mode === 'load') {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);
    try {
      const result = await loaderRef.current();
      if (mounted.current) {
        setData(result);
      }
    } catch (e) {
      if (mounted.current) {
        setError(getErrorMessage(e));
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  const reload = useCallback(() => run('load'), [run]);
  const refresh = useCallback(() => run('refresh'), [run]);

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, refreshing, error, reload, refresh, setData };
}
