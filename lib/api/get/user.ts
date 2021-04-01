import { APIError } from 'lib/api/error';
import { User } from 'lib/model/user';
import { db } from 'lib/api/firebase';

export default async function getUser(uid: string): Promise<User> {
  const doc = await db.collection('users').doc(uid).get();
  if (!doc.exists) throw new APIError(`User (${uid}) does not exist`, 400);
  return User.fromFirestoreDoc(doc);
}
