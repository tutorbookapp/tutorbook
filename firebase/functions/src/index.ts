import * as functions from 'firebase-functions';
import { userUpdate } from './algolia';

export const algoliaUserUpdate = functions.firestore
  .document('partitions/{partition}/users/{user}')
  .onWrite(userUpdate);
