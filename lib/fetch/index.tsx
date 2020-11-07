import axios, { AxiosResponse, AxiosError } from 'axios';
import { mutate } from 'swr';
import to from 'await-to-js';

import { APIErrorJSON } from 'lib/api/error';

export async function fetcher<T>(url: string): Promise<T> {
  const [err, res] = await to<AxiosResponse<T>, AxiosError<APIErrorJSON>>(
    axios.get<T>(url)
  );
  const error: (description: string) => never = (description: string) => {
    throw new Error(description);
  };
  if (err && err.response) {
    error(`API (${url}) responded with error: ${err.response.data.message}`);
  } else if (err && err.request) {
    error(`API (${url}) did not respond.`);
  } else if (err) {
    error(`${err.name} calling API (${url}): ${err.message}`);
  }
  return (res as AxiosResponse<T>).data;
}

export async function prefetch(url: string): Promise<void> {
  await mutate(url, fetcher(url));
}
