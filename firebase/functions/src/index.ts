import * as functions from 'firebase-functions';

import { requestUpdate, matchUpdate, userUpdate } from './algolia';

export const algoliaUserUpdate = functions.firestore
  .document('partitions/{partition}/users/{user}')
  .onWrite(userUpdate);

export const algoliaMatchUpdate = functions.firestore
  .document('partitions/{partition}/matches/{match}')
  .onWrite(matchUpdate);

export const algoliaRequestUpdate = functions.firestore
  .document('partitions/{partition}/requests/{request}')
  .onWrite(requestUpdate);
