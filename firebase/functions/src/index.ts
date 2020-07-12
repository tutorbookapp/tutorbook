import * as functions from 'firebase-functions';
import { apptUpdate, userUpdate } from './algolia';

export const algoliaUserUpdate = functions.firestore
  .document('partitions/{partition}/users/{user}')
  .onWrite(userUpdate);

export const algoliaApptUpdate = functions.firestore
  .document('partitions/{partition}/appts/{appt}')
  .onWrite(apptUpdate);
