import * as admin from 'firebase-admin';

import firebase from '@tutorbook/firebase';

import { AccountInterface, Account } from './account';

/**
 * Type aliases so that we don't have to type out the whole type. We could try
 * importing these directly from the `@firebase/firestore-types` or the
 * `@google-cloud/firestore` packages, but that's not recommended.
 * @todo Perhaps figure out a way to **only** import the type defs we need.
 */
type DocumentData = firebase.firestore.DocumentData;
type DocumentSnapshot = firebase.firestore.DocumentSnapshot;
type SnapshotOptions = firebase.firestore.SnapshotOptions;
type AdminDocumentSnapshot = admin.firestore.DocumentSnapshot;

/**
 * An `Org` object represents a non-profit organization that is using Tutorbook
 * to manage their virtual tutoring programs.
 * @typedef {Object} Org
 * @property members - An array of user UIDs that are members of this org.
 */
export interface OrgInterface extends AccountInterface {
  members: string[];
}

export class Org extends Account implements OrgInterface {
  public members: string[] = [];

  public constructor(org: Partial<OrgInterface> = {}) {
    super(org);
    Object.entries(org).forEach(([key, val]: [string, any]) => {
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */
      if (val && key in this && !(key in new Account()))
        (this as Record<string, any>)[key] = val;
    });
  }

  public static fromFirestore(
    snapshot: DocumentSnapshot | AdminDocumentSnapshot,
    options?: SnapshotOptions
  ): Org {
    const userData: DocumentData | undefined = snapshot.data(options);
    if (userData) {
      const { availability, ...rest } = userData;
      return new Org({
        ...rest,
        ref: snapshot.ref,
        id: snapshot.id,
      });
    }
    console.warn(
      `[WARNING] Tried to create user (${snapshot.ref.id}) from ` +
        'non-existent Firestore document.'
    );
    return new Org();
  }
}
