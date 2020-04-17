import { Change, EventContext } from 'firebase-functions';
import { DocumentSnapshot, Timestamp } from '@google-cloud/firestore';
import { SearchClient, SearchIndex } from 'algoliasearch';

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

export async function userUpdate(
  change: Change<DocumentSnapshot>,
  context: EventContext
): Promise<void> {
  const indexId: string = context.params.partition + '-users';
  const index: SearchIndex = client.initIndex(indexId);
  if (!change.after.exists) {
    await index.deleteObject(context.params.user);
  } else {
    const ob: Record<string, any> = change.after.data() as Record<string, any>;
    ob.objectID = context.params.user;
    ob.schedule = availabilityToDates(ob.schedule);
    ob.availability = availabilityToDates(ob.availability);
    await index.saveObject(ob);
  }
  index.setSettings({
    attributesForFaceting: [
      'subjects.explicit',
      'subjects.implicit',
      'subjects.filled',
      'searches.explicit',
      'searches.implicit',
      'searches.filled',
      'availability',
      'schedule',
    ],
  });
}
