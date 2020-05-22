import { Change, EventContext } from 'firebase-functions';
import { SearchClient, SearchIndex } from 'algoliasearch';
import {
  DocumentData,
  DocumentSnapshot,
  Timestamp,
} from '@google-cloud/firestore';

import * as functions from 'firebase-functions';
import algoliasearch from 'algoliasearch';

const client: SearchClient = algoliasearch(
  functions.config().algolia.id,
  functions.config().algolia.key
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
export async function userUpdate(
  change: Change<DocumentSnapshot>,
  context: EventContext
): Promise<void> {
  const indexId: string = context.params.partition + '-users';
  const index: SearchIndex = client.initIndex(indexId);
  if (!change.after.exists) {
    console.log(`[DEBUG] Deleting user (${context.params.user})...`);
    await index.deleteObject(context.params.user);
  } else {
    const user: DocumentData = change.after.data() as DocumentData;
    console.log(`[DEBUG] Updating ${user.name} (${context.params.user})...`);
    const ob: Record<string, any> = {
      name: onlyFirstNameAndLastInitial(user.name),
      bio: user.bio,
      availability: availabilityToDates(user.availability),
      subjects: user.subjects,
      searches: user.searches,
      socials: user.socials,
      objectID: context.params.user,
    };
    await index.saveObject(ob);
  }
  index.setSettings({
    attributesForFaceting: [
      'expertise',
      'subjects',
      'searches',
      'availability',
    ].map((attr: string) => `filterOnly(${attr})`),
  });
}
