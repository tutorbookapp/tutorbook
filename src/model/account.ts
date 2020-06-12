import * as admin from 'firebase-admin';

import firebase from '@tutorbook/firebase';
import phone from 'phone';

/**
 * Type aliases so that we don't have to type out the whole type. We could try
 * importing these directly from the `@firebase/firestore-types` or the
 * `@google-cloud/firestore` packages, but that's not recommended.
 * @todo Perhaps figure out a way to **only** import the type defs we need.
 */
type DocumentData = firebase.firestore.DocumentData;
type SnapshotOptions = firebase.firestore.SnapshotOptions;
type DocumentSnapshot = firebase.firestore.DocumentSnapshot;
type DocumentReference = firebase.firestore.DocumentReference;
type AdminDocumentSnapshot = admin.firestore.DocumentSnapshot;
type AdminDocumentReference = admin.firestore.DocumentReference;

/**
 * Duplicate definition from the `@tutorbook/react-intercom` package. These are
 * all the valid datatypes for custom Intercom user attributes.
 * @see {@link https://www.intercom.com/help/en/articles/179-send-custom-user-attributes-to-intercom}
 */
type IntercomCustomAttribute = string | boolean | number | Date;

/**
 * An `Account` object is the base object that is extended by the `Org` and
 * `User` objects. That way, we can have one `AccountProvider` for both orgs and
 * users.
 */
export interface AccountInterface {
  id: string;
  name: string;
  photo: string;
  email: string;
  phone: string;
  bio: string;
  ref?: DocumentReference | AdminDocumentReference;
}

export class Account implements AccountInterface {
  public id = '';

  public name = '';

  public photo = '';

  public email = '';

  public phone = '';

  public bio = '';

  public ref?: DocumentReference | AdminDocumentReference;

  public constructor(account: Partial<AccountInterface> = {}) {
    Object.entries(account).forEach(([key, val]: [string, any]) => {
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */
      if (val && key in this) (this as Record<string, any>)[key] = val;
    });
    this.phone = phone(this.phone)[0] || '';
  }

  /**
   * Converts this `Account` object into a `Record<string, any>` that Intercom
   * can understand.
   * @see {@link https://developers.intercom.com/installing-intercom/docs/javascript-api-attributes-objects#section-data-attributes}
   */
  public toIntercom(): Record<string, IntercomCustomAttribute> {
    const { id, photo, ref, ...rest } = this;
    const isFilled: (val: any) => boolean = (val: any) => {
      switch (typeof val) {
        case 'string':
          return val !== '';
        case 'boolean':
          return true;
        case 'number':
          return true;
        case 'undefined':
          return false;
        case 'object':
          return Object.values(val).filter(isFilled).length > 0;
        default:
          return !!val;
      }
    };
    const isValid: (val: any) => boolean = (val: any) => {
      if (typeof val === 'string') return true;
      if (typeof val === 'boolean') return true;
      if (typeof val === 'number') return true;
      if (val instanceof Date) return true;
      return false;
    };
    const intercomValues: Record<string, any> = {
      user_id: id || undefined,
      ref: ref ? ref.path : undefined,
      avatar: photo ? { type: 'avatar', image_url: photo } : undefined,
      ...rest,
    };
    return Object.fromEntries(
      Object.entries(intercomValues)
        .filter(([key, val]) => isFilled(val))
        .map(([key, val]) => [key, isValid(val) ? val : JSON.stringify(val)])
    );
  }

  public static fromFirestore(
    snapshot: DocumentSnapshot | AdminDocumentSnapshot,
    options?: SnapshotOptions
  ): Account {
    const userData: DocumentData | undefined = snapshot.data(options);
    if (userData) {
      const { availability, ...rest } = userData;
      return new Account({
        ...rest,
        ref: snapshot.ref,
        id: snapshot.id,
      });
    }
    console.warn(
      `[WARNING] Tried to create account (${snapshot.ref.id}) from ` +
        'non-existent Firestore document.'
    );
    return new Account();
  }
}
