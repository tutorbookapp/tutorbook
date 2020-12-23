import {
  DeleteResponse,
  SaveObjectResponse,
  SetSettingsResponse,
} from '@algolia/client-search';
import algoliasearch from 'algoliasearch';

import clone from 'lib/utils/clone';

const algoliaId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID as string;
const algoliaKey = process.env.ALGOLIA_ADMIN_KEY as string;

const client = algoliasearch(algoliaId, algoliaKey);

export function updateFilterableAttrs(
  indexId: string,
  attrs: string[]
): Promise<SetSettingsResponse> {
  const idx = client.initIndex(`${process.env.APP_ENV as string}-${indexId}`);
  const attributesForFaceting = attrs.map((attr) => `filterOnly(${attr})`);
  return (idx.setSettings({ attributesForFaceting }) as unknown) as Promise<
    SetSettingsResponse
  >;
}

export function deleteObj(
  indexId: string,
  objId: string
): Promise<DeleteResponse> {
  const idx = client.initIndex(`${process.env.APP_ENV as string}-${indexId}`);
  return (idx.deleteObject(objId) as unknown) as Promise<DeleteResponse>;
}

export default function index<
  T extends { toSearchHit: () => Record<string, unknown> }
>(indexId: string, obj: T, tags?: string[]): Promise<SaveObjectResponse> {
  const idx = client.initIndex(`${process.env.APP_ENV as string}-${indexId}`);
  const idxObj = clone({ ...obj.toSearchHit(), _tags: tags });
  return (idx.saveObject(idxObj) as unknown) as Promise<SaveObjectResponse>;
}
