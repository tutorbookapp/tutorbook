import * as functions from 'firebase-functions';

import { matchUpdate, userUpdate } from './algolia';

export const algoliaUserUpdate = functions.firestore
  .document('partitions/{partition}/users/{user}')
  .onWrite(userUpdate);

export const algoliaMatchUpdate = functions.firestore
  .document('partitions/{partition}/matches/{match}')
  .onWrite(matchUpdate);
