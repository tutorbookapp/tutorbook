import * as functions from 'firebase-functions';
import admin from 'firebase-admin';

import { requestUpdate, matchUpdate, userUpdate } from './algolia';
import syncUserName from './sync-user-name';
import addPeopleIds from './add-people-ids';

/**
 * We don't have to provide any authentication for this because it's already
 * included as environment variables in the GCP function Node.js runtime.
 * @see {@link https://bit.ly/3eXZeOz}
 */
admin.initializeApp();

export const algoliaUserUpdate = functions.firestore
  .document('partitions/{partition}/users/{user}')
  .onWrite(userUpdate);

export const algoliaMatchUpdate = functions.firestore
  .document('partitions/{partition}/matches/{match}')
  .onWrite(matchUpdate);

export const algoliaRequestUpdate = functions.firestore
  .document('partitions/{partition}/requests/{request}')
  .onWrite(requestUpdate);

export const syncUserNameUpdate = functions.firestore
  .document('partitions/{partition}/users/{user}')
  .onWrite(syncUserName);

export const addPeopleIdsRequest = functions.firestore
  .document('partitions/{partition}/requests/{request}')
  .onWrite(addPeopleIds);

export const addPeopleIdsMatch = functions.firestore
  .document('partitions/{partition}/matches/{match}')
  .onWrite(addPeopleIds);
