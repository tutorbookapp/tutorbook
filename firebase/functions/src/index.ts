import * as functions from 'firebase-functions';

import { matchUpdate, requestUpdate, userUpdate } from './algolia';
import syncUserName from './sync-user-name';
import addPeopleIds from './add-people-ids';

export const algoliaUserUpdate = functions.firestore
  .document('users/{user}')
  .onWrite(userUpdate);

export const algoliaMatchUpdate = functions.firestore
  .document('matches/{match}')
  .onWrite(matchUpdate);

export const algoliaRequestUpdate = functions.firestore
  .document('requests/{request}')
  .onWrite(requestUpdate);

export const syncUserNameUpdate = functions.firestore
  .document('users/{user}')
  .onWrite(syncUserName);

export const addPeopleIdsRequest = functions.firestore
  .document('requests/{request}')
  .onWrite(addPeopleIds);

export const addPeopleIdsMatch = functions.firestore
  .document('matches/{match}')
  .onWrite(addPeopleIds);
