import admin from 'firebase-admin';

export type DocumentReference = admin.firestore.DocumentReference;
export type DocumentSnapshot = admin.firestore.DocumentSnapshot;
export type Timestamp = admin.firestore.Timestamp;

export interface Person {
  id: string;
  name: string;
  photo: string;
  roles: string[];
  handle: string;
}
