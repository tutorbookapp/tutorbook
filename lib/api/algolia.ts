import {
  DeleteResponse,
  SaveObjectResponse,
  SetSettingsResponse,
} from '@algolia/client-search';
import algoliasearch from 'algoliasearch';

import {
  Availability,
  AvailabilitySearchHit,
  Timeslot,
  TimeslotSearchHit,
} from 'lib/model';
import clone from 'lib/utils/clone';

const algoliaId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID as string;
const algoliaKey = process.env.ALGOLIA_ADMIN_KEY as string;

const client = algoliasearch(algoliaId, algoliaKey);

function getIdxTime(time: Timeslot): TimeslotSearchHit {
  return { ...time, from: time.from.valueOf(), to: time.to.valueOf() };
}

// TODO: Create `toSearchHit` methods for the `Availability` objects and use
// those instead of creating these helper functions during indexing.
function getIdxTimes(times: Availability): AvailabilitySearchHit {
  return Array.from(times.map(getIdxTime));
}

interface Temp {
  availability: Availability;
  time: Timeslot;
}

interface TempSearchHit {
  availability: AvailabilitySearchHit;
  time: TimeslotSearchHit;
}

// TODO: Remove all of these ugly Typescript workarounds.
function updateTimes(idxObj: unknown): void {
  const obj = idxObj as Temp;
  const hit = idxObj as TempSearchHit;
  if (obj.availability) hit.availability = getIdxTimes(obj.availability);
  if (obj.time) hit.time = getIdxTime(obj.time);
}

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

export default function index<T extends { id: string }>(
  indexId: string,
  obj: T,
  tags?: string[]
): Promise<SaveObjectResponse> {
  const idx = client.initIndex(`${process.env.APP_ENV as string}-${indexId}`);
  const idxObj = clone<Omit<T, 'id'> & { id?: string }>({
    ...obj,
    _tags: tags,
    objectID: obj.id,
  });
  delete idxObj.id;
  updateTimes(idxObj);
  return (idx.saveObject(idxObj) as unknown) as Promise<SaveObjectResponse>;
}
