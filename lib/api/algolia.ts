import {
  DeleteResponse,
  PartialUpdateObjectResponse,
} from '@algolia/client-search';
import { WaitablePromise } from '@algolia/client-common';
import algoliasearch from 'algoliasearch';

const algoliaId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID as string;
const algoliaKey = process.env.ALGOLIA_ADMIN_KEY as string;

export const prefix =
  process.env.ALGOLIA_PREFIX || (process.env.APP_ENV as string);
export const client = algoliasearch(algoliaId, algoliaKey);

export function deleteObj(
  indexId: string,
  objId: string
): WaitablePromise<DeleteResponse> {
  const idx = client.initIndex(`${prefix}-${indexId}`);
  const promise = idx.deleteObject(objId);

  // TODO: Test how much slower it is to actually wait for these operations. If
  // it isn't too much slower, we should do it by default (so we're testing the
  // default behavior of our app during integration tests).
  if (['development', 'test'].includes(process.env.APP_ENV as string))
    return promise.wait();
  return promise;
}

export default function index<T>(
  indexId: string,
  obj: T
): WaitablePromise<PartialUpdateObjectResponse> {
  // We use a partial update to prevent overriding attributes that are indexed
  // asynchronously (e.g. updating availability and tags in parallel).
  const idx = client.initIndex(`${prefix}-${indexId}`);
  const options = { createIfNotExists: true };
  const promise = idx.partialUpdateObject(obj, options);

  // TODO: Test how much slower it is to actually wait for these operations. If
  // it isn't too much slower, we should do it by default (so we're testing the
  // default behavior of our app during integration tests).
  if (['development', 'test'].includes(process.env.APP_ENV as string))
    return promise.wait();
  return promise;
}
