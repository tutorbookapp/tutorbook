import * as functions from 'firebase-functions';

import syncUserName from './sync-user-name';
import addPeopleIds from './add-people-ids';

export const syncUserNameUpdate = functions.firestore
  .document('users/{user}')
  .onWrite(syncUserName);

export const addPeopleIdsRequest = functions.firestore
  .document('requests/{request}')
  .onWrite(addPeopleIds);

export const addPeopleIdsMatch = functions.firestore
  .document('matches/{match}')
  .onWrite(addPeopleIds);
