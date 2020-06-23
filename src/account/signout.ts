import firebase from '@tutorbook/firebase';
import 'firebase/auth';

import { User } from '@tutorbook/model';
import { mutate } from 'swr';

export default async function signout(): Promise<void> {
  await firebase.auth().signOut();
  await mutate('/api/account', new User().toJSON(), false);
}
