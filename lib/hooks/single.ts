import { FormEvent, useCallback, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { dequal } from 'dequal/lite';
import to from 'await-to-js';

import { APIErrorJSON } from 'lib/api/error';
import { Callback } from 'lib/model';
import { Validations } from 'lib/context/validations';

interface SingleProps<T> {
  data: T;
  setData: Callback<T>;
  validations: Validations;
  setValidations: Callback<Validations>;
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
 * @todo Locally mutating data before updating the remote makes changes feel
 * faster but having a loader visible defeats that purpose. Should we even
 * locally mutate data first, then? Or should we hide the loader before the
 * remote is properly updated?
 */
export default function useSingle<T extends { id: string }>(
  initialData: T,
  updateRemote: (data: T) => Promise<T | void>,
  updateLocal?: (data: T, hasBeenUpdated?: boolean) => Promise<void> | void
): SingleProps<T> {
  const [data, setData] = useState<T>(initialData);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [checked, setChecked] = useState<boolean>(false);
  const [validations, setValidations] = useState<Validations>({});

  const onSubmit = useCallback(
    async (evt?: FormEvent) => {
      // Validate submission data.
      if (evt) evt.preventDefault();
      if (Object.values(validations).some((v) => !v())) return;
      // Show a loading state.
      setError('');
      setChecked(false);
      setLoading(true);
      // Immediately mutate local data.
      if (updateLocal) await updateLocal(data, false);
      // Update remote data with POST or PUT API request.
      const [err, res] = await to(updateRemote(data));
      if (err) {
        // Hide the loading state, error has been received.
        setLoading(false);
        // If the server sends an error, show error message.
        const e = (err as AxiosError<APIErrorJSON>).response?.data || err;
        setError(e.message);
      } else {
        // Otherwise, mutate local data with the server's response.
        if (!dequal(res, data)) {
          setData(res as T);
          if (updateLocal) await updateLocal(res as T, true);
        } else if (updateLocal) {
          // Signal that local data is now in sync with server data.
          await updateLocal(data, true);
        }
        setChecked(true);
        // Hide the loading state. Data has been updated.
        setTimeout(() => setLoading(false), 1000);
      }
    },
    [updateLocal, updateRemote, data, validations]
  );

  useEffect(() => {
    // Initial data takes precedence over local component-scoped data (e.g. when
    // editing a profile that can be updated from multiple locations).
    setData((prev: T) => (dequal(prev, initialData) ? prev : initialData));
  }, [initialData]);

  return {
    data,
    setData,
    validations,
    setValidations,
    onSubmit,
    error,
    loading,
    checked,
  };
}
