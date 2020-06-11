import * as admin from 'firebase-admin';

import firebase from '@tutorbook/firebase';
import phone from 'phone';

type DocumentReference = firebase.firestore.DocumentReference;
type AdminDocumentReference = admin.firestore.DocumentReference;

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
}
