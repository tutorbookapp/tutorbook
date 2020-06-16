import { config, Change, EventContext } from 'firebase-functions';
import algoliasearch, { SearchClient, SearchIndex } from 'algoliasearch';

import * as admin from 'firebase-admin';

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
 * For privacy reasons, we only add the user's first name and last initial to
 * our Algolia search index (and thus we **never** share the user's full name).
 * @example
 * assert(onlyFirstNameAndLastInitial('Nicholas Chiang') === 'Nicholas C.');
 * @todo Avoid code duplication from `/api/search` REST API endpoint.
 */
function onlyFirstNameAndLastInitial(name: string): string {
  const split: string[] = name.split(' ');
  return `${split[0]} ${split[split.length - 1][0]}.`;
}

/**
 * We use Algolia's tagging feature to support some otherwise impossible
 * querying logic (i.e. the logic is run here, during indexing time, and then
 * can be queried later).
 */
function getTags(user: Record<string, unknown>): string[] {
  const tags: string[] = [];
  if (!((user.verifications as unknown[]) || []).length)
    tags.push('is_not_vetted');
  return tags;
}

/**
 * We only add non-sensitive information to our Algolia search index (because it
 * is publicly available via our `/api/search` REST API endpoint):
 * - User's first name and last initial
 * - User's bio (e.g. their education and experience)
 * - User's availability (for tutoring)
 * - User's subjects (what they can tutor)
 * - User's searches (what they need tutoring for)
 * - User's Firebase Authentication uID (as the Algolia `objectID`)
 * @todo Perhaps we should also include a `photoURL` here (to make our search
 * results look more appealing).
 */
export default async function userUpdate(
  change: Change<DocumentSnapshot>,
  context: EventContext
): Promise<void> {
  const uid: string = context.params.user as string;
  const indexId = `${context.params.partition as string}-users`;
  const index: SearchIndex = client.initIndex(indexId);
  const adminIndexId = `${context.params.partition as string}-admin-users`;
  const adminIndex: SearchIndex = client.initIndex(adminIndexId);
  if (!change.after.exists) {
    console.log(`[DEBUG] Deleting user (${uid})...`);
    await index.deleteObject(uid);
    await adminIndex.deleteObject(uid);
  } else {
    const user = change.after.data() as Record<string, unknown>;
    console.log(`[DEBUG] Updating ${user.name as string} (${uid})...`);
    const ob: Record<string, unknown> = {
      name: onlyFirstNameAndLastInitial(user.name as string),
      photo: user.photo,
      bio: user.bio,
      orgs: user.orgs,
      availability: availabilityToDates(
        user.availability as Timeslot<Timestamp>[]
      ),
      verifications: user.verifications,
      mentoring: user.mentoring,
      tutoring: user.tutoring,
      socials: user.socials,
      langs: user.langs,
      objectID: uid,
      featured: user.featured,
    };
    await index.saveObject(ob);
    const adminOb: Record<string, unknown> = { ...ob, _tags: getTags(user) };
    await adminIndex.saveObject(adminOb);
  }
  const settings = {
    attributesForFaceting: [
      'orgs',
      'availability',
      'mentoring.subjects',
      'mentoring.searches',
      'tutoring.subjects',
      'tutoring.searches',
      'verifications.checks',
      'langs',
      'featured',
    ].map((attr: string) => `filterOnly(${attr})`),
  };
  await index.setSettings(settings);
  await adminIndex.setSettings(settings);
}
