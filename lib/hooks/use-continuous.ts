import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import equal from 'fast-deep-equal';
import to from 'await-to-js';

import { Callback } from 'lib/model';

import usePrevious from './use-previous';

interface ContinuousProps<T> {
  data: T;
  setData: Callback<T>;
  error?: Error;
  timeout: number;
  retry: () => Promise<void>;
}

/**
 * React hook that implements the continuous update form data flow.
 * 1. Immediately mutate local data.
 * 2. Set a timeout to update the remote data. Clear any existing timeouts.
 * 3. Update the remote data with a POST or PUT API request.
 * 4. If the server sends an error, show an error message and use exponential
 *    backoff to continually retry the request. Local data stays mutated.
 * 5. Otherwise, mutate local data with the server's response.
 * @see {@link https://github.com/tutorbookapp/tutorbook#forms-and-data-mutation}
 */
export default function useContinuous<T extends { id: string }>(
  initialData: T,
  updateRemote: (data: T) => Promise<T | void>,
  updateLocal?: (data: T) => Promise<void>,
  initialTimeout: number = 5000
): ContinuousProps<T> {
  const [data, setData] = useState<T>(initialData);
  const [error, setError] = useState<Error>();
  const [retryCount, setRetryCount] = useState<number>(0);

  const prevData = usePrevious<T>(data);
  const lastReceivedResponse = useRef<T>();

  const retry = useCallback(async () => {
    const [err, res] = await to(updateRemote(data));
    if (err) {
      setError(err);
      setRetryCount((prev: number) => prev + 1);
    } else {
      setError(undefined);
      setRetryCount(0);
      if (!equal(res, data)) {
        lastReceivedResponse.current = res as T;
        setData(res as T);
      }
    }
  }, [updateRemote, data]);

  const timeout = useMemo(() => {
    // Exponential backoff equation taken from the @vercel/swr source code.
    // TODO: Use existing retry libraries instead (don't reinvent the wheel).
    // @see {@link https://github.com/vercel/async-retry}
    // @see {@link https://github.com/tim-kos/node-retry}
    const count = Math.min(retryCount, 8);
    // eslint-disable-next-line no-bitwise
    const backoff = ~~((Math.random() + 0.5) * (1 << count)) * initialTimeout;
    // Never go below the initial timeout (i.e. never immediately update data).
    return Math.max(backoff, initialTimeout);
  }, [retryCount, initialTimeout]);

  useEffect(() => {
    // Don't update remote data for unidentified resource.
    if (!data.id || !prevData.id) return;
    // Don't update remote with the response the remote sent us.
    if (equal(lastReceivedResponse.current, data)) return;
    const timeoutId = setTimeout(() => {
      void retry();
    }, timeout);
    return () => clearTimeout(timeoutId);
  }, [data, prevData, retry, timeout]);

  useEffect(() => {
    // Immediately mutate local data.
    if (data.id && prevData.id && updateLocal) {
      void updateLocal(data);
    }
  }, [updateLocal, data, prevData]);

  useEffect(() => {
    // Initial data takes precedence over local component-scoped data (e.g. when
    // editing a profile that can be updated from multiple locations).
    setData((prev: T) => (equal(prev, initialData) ? prev : initialData));
  }, [initialData]);

  return { error, retry, timeout, data, setData };
}
