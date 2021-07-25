import { dequal } from 'dequal/lite';

import { User, UserTag } from 'lib/model/user';
import analytics from 'lib/api/analytics';
import updateUserDoc from 'lib/api/update/user-doc';
import updateUserTags from 'lib/api/update/user-tags';

export default async function updatePeopleTags(
  people: User[],
  actions?: { add?: UserTag[]; remove?: UserTag[] }
): Promise<void> {
  await Promise.all(
    people.map(async (person) => {
      const user = updateUserTags(person, actions);
      if (dequal(user.tags, person.tags)) return;
      await Promise.all([updateUserDoc(user), analytics(user, 'updated')]);
    })
  );
}
