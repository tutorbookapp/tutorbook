import { Change, EventContext } from 'firebase-functions';
import { DocumentSnapshot } from '@google-cloud/firestore';
import { SearchClient, SearchIndex } from 'algoliasearch';

import * as functions from 'firebase-functions';
import algoliasearch from 'algoliasearch';

const client: SearchClient = algoliasearch(
  functions.config().algolia.id,
  functions.config().algolia.key
);

export async function userUpdate(
  change: Change<DocumentSnapshot>,
  context: EventContext
): Promise<void> {
  const indexId: string = context.params.partition + '-users';
  const index: SearchIndex = client.initIndex(indexId);
  if (!change.after.exists || !change.after.data()) {
    await index.deleteObject(context.params.user);
  } else {
    const ob: Record<string, any> = change.after.data() as Record<string, any>;
    ob.objectID = context.params.user;
    await index.saveObject(ob);
  }
}
