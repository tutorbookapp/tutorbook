import { User } from 'lib/model';
import { client } from 'lib/api/algolia';

/**
 * Updates the given people's role-related tags in Algolia. Takes advantage of
 * Algolia's built-in `AddUnique` operation to add each person's roles to their
 * `_tags` only if the role isn't already there.
 * @see {@link https://bit.ly/3dTQQCL}
 * @todo Perhaps include every role that a user has ever played in the user data
 * model so that it can be easily accessible for e.g. their profile page. We
 * could distinguish between them by having `role` (singular) be the match
 * specific value while `roles` (plural) indicate every role they've played.
 * @todo This function assumes that each person only has one role.
 */
export default async function updatePeopleRoles(people: User[]): Promise<void> {
  const idx = client.initIndex(`${process.env.APP_ENV as string}-users`);
  await Promise.all(
    people.map((person) =>
      idx.partialUpdateObject({
        objectID: person.id,
        _tags: { _operation: 'AddUnique', value: person.roles[0] },
      })
    )
  );
}
