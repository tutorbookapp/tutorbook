import { Change, EventContext } from 'firebase-functions';
import admin from 'firebase-admin';

import { DocumentSnapshot, Person } from './types';

/**
 * We store the user's name and photo within their `Person` object in a variety
 * of different resources:
 * - Requests (i.e. job posts).
 * - Matches (i.e. tutoring/mentoring appointments).
 * That way, the front-end doesn't have to fetch each user's document in order
 * to intelligibly render their name and photo.
 * @todo Sync the user's Firebase Authentication account metadata as well (i.e.
 * update their `photoURL` and `displayName` based on what's in their user doc).
 */
export default async function syncUserName(
  change: Change<DocumentSnapshot>,
  context: EventContext
): Promise<void> {
  if (!change.after.exists) {
    // TODO: Delete this user from the `people` on all requests and matches. Or,
    // perhaps just replace their name and photo to indicate their account no
    // longer exists (this is what Google does). Also, make sure to delete their
    // Firebase Authentication account.
    throw new Error('Cannot handle user deletion... yet.');
  }

  const user = change.after.data() as Pick<Person, 'id' | 'name' | 'photo'>;

  if (change.before.exists) {
    // If the `name` and `photo` is unchanged, we don't have to do anything.
    const old = change.before.data() as Pick<Person, 'id' | 'name' | 'photo'>;
    if (old.name === user.name && old.photo === user.photo) return;
  }

  const firestore = admin.firestore();
  firestore.settings({ ignoreUndefinedProperties: true });
  const db = firestore.collection('partitions').doc(context.params.partition);

  async function updateResource(resource: DocumentSnapshot): Promise<void> {
    const old = resource.data() as { people: Person[]; creator: Person };
    const updated = { ...old };
    if (user.id === old.creator.id) {
      updated.creator = { ...old.creator, name: user.name, photo: user.photo };
    }
    const idx = old.people.findIndex(({ id }) => id === user.id);
    if (idx < 0 && user.id !== old.creator.id) {
      // TODO: Gracefully remove the user from `peopleIds` b/c this should never
      // happen (unless `peopleIds` doesn't match `people`).
      throw new Error(`User (${user.id}) wasn't on resource (${resource.id}).`);
    } else if (idx >= 0) {
      updated.people = [
        ...old.people.slice(0, idx),
        { ...old.people[idx], name: user.name, photo: user.photo },
        ...old.people.slice(idx + 1),
      ];
    }
    await resource.ref.update(updated);
  }

  const requests = (
    await db
      .collection('requests')
      .where('peopleIds', 'array-contains', user.id)
      .get()
  ).docs;
  await Promise.all(requests.map(updateResource));

  const matches = (
    await db
      .collection('matches')
      .where('peopleIds', 'array-contains', user.id)
      .get()
  ).docs;
  await Promise.all(matches.map(updateResource));
}
