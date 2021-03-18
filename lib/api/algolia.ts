import {
  DeleteResponse,
  SaveObjectResponse,
  SetSettingsResponse,
} from '@algolia/client-search';
import { WaitablePromise } from '@algolia/client-common';
import algoliasearch from 'algoliasearch';

const prefix = process.env.ALGOLIA_PREFIX || (process.env.APP_ENV as string);
const algoliaId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID as string;
const algoliaKey = process.env.ALGOLIA_ADMIN_KEY as string;

export const client = algoliasearch(algoliaId, algoliaKey);

export function updateFilterableAttrs(
  indexId: string,
  attrs: string[]
): WaitablePromise<SetSettingsResponse> {
  const idx = client.initIndex(`${prefix}-${indexId}`);
  const attributesForFaceting = attrs.map((attr) => `filterOnly(${attr})`);
  return idx.setSettings({ attributesForFaceting });
}

export function deleteObj(
  indexId: string,
  objId: string
): WaitablePromise<DeleteResponse> {
  const idx = client.initIndex(`${prefix}-${indexId}`);
  return idx.deleteObject(objId);
}

export default function index<T extends { toSearchHit: () => object }>(
  indexId: string,
  obj: T
): WaitablePromise<SaveObjectResponse> {
  const idx = client.initIndex(`${prefix}-${indexId}`);
  return idx.saveObject(obj.toSearchHit());
}
