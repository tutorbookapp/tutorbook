import {
  DeleteResponse,
  SaveObjectResponse,
  SetSettingsResponse,
} from '@algolia/client-search';
import { WaitablePromise } from '@algolia/client-common';
import algoliasearch from 'algoliasearch';

import clone from 'lib/utils/clone';

const algoliaId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID as string;
const algoliaKey = process.env.ALGOLIA_ADMIN_KEY as string;

export const client = algoliasearch(algoliaId, algoliaKey);

export function updateFilterableAttrs(
  indexId: string,
  attrs: string[]
): WaitablePromise<SetSettingsResponse> {
  const idx = client.initIndex(`${process.env.APP_ENV as string}-${indexId}`);
  const attributesForFaceting = attrs.map((attr) => `filterOnly(${attr})`);
  return idx.setSettings({ attributesForFaceting });
}

export function deleteObj(
  indexId: string,
  objId: string
): WaitablePromise<DeleteResponse> {
  const idx = client.initIndex(`${process.env.APP_ENV as string}-${indexId}`);
  return idx.deleteObject(objId);
}

export default function index<
  T extends { toSearchHit: () => object; tags?: string[] }
>(indexId: string, obj: T): WaitablePromise<SaveObjectResponse> {
  // TODO: Also save all of the "not" tags (e.g. `not-vetted`) because Algolia
  // doesn't support filtering by missing values or missing tags.
  const idx = client.initIndex(`${process.env.APP_ENV as string}-${indexId}`);
  // TODO: Don't store tags both in "tags" and in "_tags". Instead, we should
  // convert "tags" to "_tags" in the user search object like "objectID".
  const idxObj = clone({ ...obj.toSearchHit(), _tags: obj.tags });
  return idx.saveObject(idxObj);
}
