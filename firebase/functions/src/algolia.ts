import { Change, EventContext, config } from 'firebase-functions';
import { Settings } from '@algolia/client-search';
import algoliasearch, { SearchClient, SearchIndex } from 'algoliasearch';
import to from 'await-to-js';
import admin from 'firebase-admin';

import { DocumentReference, DocumentSnapshot, Timestamp } from './types';

const client: SearchClient = algoliasearch(
  (config().algolia as Record<'id' | 'key', string>).id,
  (config().algolia as Record<'id' | 'key', string>).key
);

interface Timeslot<T> {
  from: T;
  to: T;
}

/**
 * All of the tags that are added to the users search index during indexing
 * (i.e. when this function runs).
 * @see src/model/user.ts
 */
const NOT_VETTED = 'not-vetted';

/**
 * Convert the availability objects (i.e. the user's schedule and availability)
 * to arrays of Unix timestamp numbers that can then be queryed like:
 * > Show me all users whose availability contains a timeslot whose open time
 * > is equal to or before the desired open time and whose close time is equal
 * > to or after the desired close time.
 * @see {@link https://firebase.google.com/docs/reference/node/firebase.firestore.Timestamp#tomillis}
 * @see {@link https://www.algolia.com/doc/guides/managing-results/refine-results/filtering/how-to/filter-by-date/?language=javascript#after}
 */
function timeslot(time: Timeslot<Timestamp>): Timeslot<number> {
  return { from: time.from.toMillis(), to: time.to.toMillis() };
}
function availability(times: Timeslot<Timestamp>[]): Timeslot<number>[] {
  return times.map(timeslot);
}

/**
 * We use Algolia's tagging feature to support some otherwise impossible
 * querying logic (i.e. the logic is run here, during indexing time, and then
 * can be queried later).
 */
function tags(user: Record<string, unknown>): string[] {
  const tgs: string[] = [];
  if (!((user.verifications as unknown[]) || []).length) tgs.push(NOT_VETTED);
  return tgs;
}

/**
 * Wrapper for the `await-to-js` function that enables use with Algolia's custom
 * "pending request" objects.
 */
function too<T, U = Error>(p: any): Promise<[U | null, T | undefined]> {
  return to<T, U>((p as unknown) as Promise<T>);
}

/**
 * Updates the settings on a given Algolia index and catches and logs any
 * errors.
 */
async function updateSettings(
  index: SearchIndex,
  settings: Settings
): Promise<void> {
  console.log(`[DEBUG] Updating search index (${index.indexName}) settings...`);
  const [err] = await too(index.setSettings(settings));
  if (err) {
    console.error(`[ERROR] ${err.name} while updating:`, err);
  } else {
    console.log(`[DEBUG] Updated search index (${index.indexName}) settings.`);
  }
}

async function updateFilterableAttributes(
  index: SearchIndex,
  attributes: string[]
): Promise<void> {
  const attributesForFaceting = attributes.map((attr) => `filterOnly(${attr})`);
  return updateSettings(index, { attributesForFaceting });
}

function handles(match: Record<string, unknown>): string[] {
  const creatorHandle = (match.creator as { handle: string }).handle;
  const peopleHandles = (match.people as { handle: string }[]).map(
    ({ handle }) => handle
  );
  return [creatorHandle, ...peopleHandles];
}

export async function matchUpdate(
  change: Change<DocumentSnapshot>,
  context: EventContext
): Promise<void> {
  const db: DocumentReference = admin
    .firestore()
    .collection('partitions')
    .doc(context.params.partition);

  /**
   * Gets the orgs for a given appointment. We add all of the orgs that each
   * appointment person is a part of during indexing. This allows us to filter
   * by org at search time (i.e. when we want to populate an org admin dashboard).
   * @param match - The appointment to fetch orgs for.
   * @return A list of org IDs that the `match` people are a part of.
   */
  async function orgs(match: Record<string, unknown>): Promise<string[]> {
    const ids: Set<string> = new Set();
    await Promise.all(
      (match.people as { id: string }[]).map(async ({ id }) => {
        const doc = await db.collection('users').doc(id).get();
        if (!doc.exists) {
          console.warn(`[WARNING] Person (${id}) doesn't exist.`);
        } else {
          (doc.data() as { orgs: string[] }).orgs.forEach((o) => ids.add(o));
        }
      })
    );
    console.log(`[DEBUG] Got orgs for match (${match.id as string}):`, ids);
    return Array.from(ids);
  }

  const id: string = context.params.match as string;
  const indexId = `${context.params.partition as string}-matches`;
  const index: SearchIndex = client.initIndex(indexId);
  if (!change.after.exists) {
    console.log(`[DEBUG] Deleting match (${id})...`);
    const [err] = await too(index.deleteObject(id));
    if (err) {
      console.error(`[ERROR] ${err.name} while deleting:`, err);
    } else {
      console.log(`[DEBUG] Deleted match (${id}).`);
    }
  } else {
    const match = change.after.data() as Record<string, unknown>;
    console.log(`[DEBUG] Updating match (${id})...`);
    const ob: Record<string, unknown> = {
      ...match,
      time: match.time
        ? timeslot(match.time as Timeslot<Timestamp>)
        : undefined,
      handles: handles(match),
      orgs: await orgs(match),
      objectID: id,
    };
    const [err] = await too(index.saveObject(ob));
    if (err) {
      console.error(`[ERROR] ${err.name} while updating:`, err);
    } else {
      console.log(`[DEBUG] Updated match (${id}).`);
    }
  }
  await updateFilterableAttributes(index, ['handles', 'orgs']);
}

export async function requestUpdate(
  change: Change<DocumentSnapshot>,
  context: EventContext
): Promise<void> {
  const db: DocumentReference = admin
    .firestore()
    .collection('partitions')
    .doc(context.params.partition);

  /**
   * Gets the orgs for a given appointment. We add all of the orgs that each
   * appointment person is a part of during indexing. This allows us to filter
   * by org at search time (i.e. when we want to populate an org admin dashboard).
   * @param request - The appointment to fetch orgs for.
   * @return A list of org IDs that the `request` people are a part of.
   */
  async function orgs(request: Record<string, unknown>): Promise<string[]> {
    const ids: Set<string> = new Set();
    await Promise.all(
      (request.people as { id: string }[]).map(async ({ id }) => {
        const doc = await db.collection('users').doc(id).get();
        if (!doc.exists) {
          console.warn(`[WARNING] Person (${id}) doesn't exist.`);
        } else {
          (doc.data() as { orgs: string[] }).orgs.forEach((o) => ids.add(o));
        }
      })
    );
    console.log(`[DEBUG] Got orgs for request (${request.id as string}):`, ids);
    return Array.from(ids);
  }

  const id: string = context.params.request as string;
  const indexId = `${context.params.partition as string}-requests`;
  const index: SearchIndex = client.initIndex(indexId);
  if (!change.after.exists) {
    console.log(`[DEBUG] Deleting request (${id})...`);
    const [err] = await too(index.deleteObject(id));
    if (err) {
      console.error(`[ERROR] ${err.name} while deleting:`, err);
    } else {
      console.log(`[DEBUG] Deleted request (${id}).`);
    }
  } else {
    const request = change.after.data() as Record<string, unknown>;
    console.log(`[DEBUG] Updating request (${id})...`);
    const ob: Record<string, unknown> = {
      ...request,
      time: request.time
        ? timeslot(request.time as Timeslot<Timestamp>)
        : undefined,
      handles: handles(request),
      orgs: await orgs(request),
      objectID: id,
    };
    const [err] = await too(index.saveObject(ob));
    if (err) {
      console.error(`[ERROR] ${err.name} while updating:`, err);
    } else {
      console.log(`[DEBUG] Updated request (${id}).`);
    }
  }
  await updateFilterableAttributes(index, ['handles', 'orgs']);
}

/**
 * We sync our Firestore database with Algolia in order to perform SQL-like
 * search operations (and to easily enable full-text search OFC).
 *
 * @todo This GCP function is triggered every time a `users` document is
 * updated. In the future, we should just combine this with the update user REST
 * API endpoint.
 */
export async function userUpdate(
  change: Change<DocumentSnapshot>,
  context: EventContext
): Promise<void> {
  const uid: string = context.params.user as string;
  const indexId = `${context.params.partition as string}-users`;
  const index: SearchIndex = client.initIndex(indexId);
  if (!change.after.exists) {
    console.log(`[DEBUG] Deleting user (${uid})...`);
    const [err] = await too(index.deleteObject(uid));
    if (err) {
      console.error(`[ERROR] ${err.name} while deleting:`, err);
    } else {
      console.log(`[DEBUG] Deleted user (${uid}).`);
    }
  } else {
    const user = change.after.data() as Record<string, unknown>;
    console.log(`[DEBUG] Updating ${user.name as string} (${uid})...`);
    const ob: Record<string, unknown> = {
      ...user,
      availability: availability(user.availability as Timeslot<Timestamp>[]),
      visible: !!user.visible,
      _tags: tags(user),
      objectID: uid,
    };
    const [err] = await too(index.saveObject(ob));
    if (err) {
      console.error(`[ERROR] ${err.name} while updating:`, err);
    } else {
      console.log(`[DEBUG] Updated ${user.name as string} (${uid}).`);
    }
  }
  // Note that we don't have to add the `visible` property here (b/c Algolia
  // automatically supports filtering by numeric and boolean values).
  await updateFilterableAttributes(index, [
    'orgs',
    'parents',
    'availability',
    'mentoring.subjects',
    'mentoring.searches',
    'tutoring.subjects',
    'tutoring.searches',
    'verifications.checks',
    'langs',
    'featured',
  ]);
}
