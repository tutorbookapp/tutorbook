import firebase from '@tutorbook/firebase';
import 'firebase/auth';

import { mutate } from 'swr';

export default async function signout(): Promise<void> {
  await firebase.auth().signOut();
  await mutate('/api/account', null);
}
