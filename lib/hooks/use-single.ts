import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { AxiosError } from 'axios';
import { dequal } from 'dequal';
import to from 'await-to-js';

import { APIErrorJSON } from 'lib/api/error';
import { Callback } from 'lib/model';

interface SingleProps<T> {
  data: T;
  setData: Callback<T>;
  onSubmit: (evt?: FormEvent) => Promise<void>;
  loading: boolean;
  checked: boolean;
  error: string;
}

/**
 * React hook that implements the single update form data flow. Upon explicit
 * user submission:
 * 1. Show a loading state.
 * 2. Immediately mutate local data.
 * 3. Update remote data with POST or PUT API request.
 * 4. If the server sends an error, reset local data and show error message.
 * 5. Otherwise, mutate local data with the server's response.
 * 6. Hide the loading state. Data has been updated or an error has occurred.
 * @see {@link https://github.com/tutorbookapp/tutorbook#forms-and-data-mutation}
 */
export default function useSingle<T extends { id: string }>(
  initialData: T,
  updateRemote: (data: T) => Promise<T | void>,
  updateLocal?: (data: T) => Promise<void> | void
): SingleProps<T> {
  const [data, setData] = useState<T>(initialData);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [checked, setChecked] = useState<boolean>(false);

  const prevData = useRef<T>(initialData);

  const onSubmit = useCallback(
    async (evt?: FormEvent) => {
      if (evt) evt.preventDefault();
      // Show a loading state.
      setError('');
      setChecked(false);
      setLoading(true);
      // Immediately mutate local data.
      if (updateLocal) await updateLocal(data);
      // Update remote data with POST or PUT API request.
      const [err, res] = await to(updateRemote(data));
      if (err) {
        // If the server sends an error, show error message.
        const e = (err as AxiosError<APIErrorJSON>).response?.data || err;
        setError(e.message);
        // Hide the loading state, error has been received.
        setLoading(false);
      } else {
        // Otherwise, mutate local data with the server's response.
        prevData.current = res as T;
        if (!dequal(res, data)) {
          setData(res as T);
          if (updateLocal) await updateLocal(res as T);
        }
        setChecked(true);
        // Hide the loading state. Data has been updated.
        setTimeout(() => setLoading(false), 1000);
      }
    },
    [updateLocal, updateRemote, data]
  );

  useEffect(() => {
    // Initial data takes precedence over local component-scoped data (e.g. when
    // editing a profile that can be updated from multiple locations).
    setData((prev: T) => (dequal(prev, initialData) ? prev : initialData));
  }, [initialData]);

  return { data, setData, onSubmit, error, loading, checked };
}
