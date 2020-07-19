import { config, Change, EventContext } from 'firebase-functions';
import { Settings } from '@algolia/client-search';
import algoliasearch, { SearchClient, SearchIndex } from 'algoliasearch';
import to from 'await-to-js';
import admin from 'firebase-admin';

type DocumentSnapshot = admin.firestore.DocumentSnapshot;
type Timestamp = admin.firestore.Timestamp;

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
function availabilityToDates(
  availability: Timeslot<Timestamp>[]
): Timeslot<number>[] {
  return availability.map((timeslot: Timeslot<Timestamp>) => {
    return { from: timeslot.from.toMillis(), to: timeslot.to.toMillis() };
  });
}

/**
 * We use Algolia's tagging feature to support some otherwise impossible
 * querying logic (i.e. the logic is run here, during indexing time, and then
 * can be queried later).
 */
function getTags(user: Record<string, unknown>): string[] {
  const tags: string[] = [];
  if (!((user.verifications as unknown[]) || []).length) tags.push(NOT_VETTED);
  return tags;
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

export async function apptUpdate(
  change: Change<DocumentSnapshot>,
  context: EventContext
): Promise<void> {
  const id: string = context.params.appt as string;
  const indexId = `${context.params.partition as string}-appts`;
  const index: SearchIndex = client.initIndex(indexId);
  if (!change.after.exists) {
    console.log(`[DEBUG] Deleting appt (${id})...`);
    const [err] = await too(index.deleteObject(id));
    if (err) {
      console.error(`[ERROR] ${err.name} while deleting:`, err);
    } else {
      console.log(`[DEBUG] Deleted appt (${id}).`);
    }
  } else {
    const appt = change.after.data() as Record<string, unknown>;
    console.log(`[DEBUG] Updating appt (${id})...`);
    const ob: Record<string, unknown> = { ...appt, objectID: id };
    const [err] = await too(index.saveObject(ob));
    if (err) {
      console.error(`[ERROR] ${err.name} while updating:`, err);
    } else {
      console.log(`[DEBUG] Updated appt (${id}).`);
    }
  }
  const attributesForFaceting: string[] = ['filterOnly(attendees.handle)'];
  await updateSettings(index, { attributesForFaceting });
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
      availability: availabilityToDates(
        user.availability as Timeslot<Timestamp>[]
      ),
      objectID: uid,
      visible: !!user.visible, // Ensure that this filterable property is added.
      _tags: getTags(user),
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
  const attributesForFaceting: string[] = [
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
  ].map((attr: string) => `filterOnly(${attr})`);
  await updateSettings(index, { attributesForFaceting });
}
