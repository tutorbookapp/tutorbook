import { Change } from 'firebase-functions';

import { DocumentSnapshot, Person } from './types';

/**
 * Adds a `peopleIds` property to requests and matches for convenient
 * server-side querying capabilities.
 * @todo Perhaps switch over to a different database b/c Firestore is kind of
 * hard to work with (and I don't like data duplication).
 */
export default async function addPeopleIds(
  change: Change<DocumentSnapshot>
): Promise<void> {
  if (!change.after.exists) return;
  const resource = change.after.data() as { people: Person[] };
  const peopleIds = new Set(resource.people.map((person: Person) => person.id));
  await change.after.ref.update({ ...resource, peopleIds: [...peopleIds] });
}
