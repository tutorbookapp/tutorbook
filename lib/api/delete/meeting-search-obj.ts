import to from 'await-to-js';

import { APIError } from 'lib/api/error';
import { deleteObj } from 'lib/api/algolia';

export default async function deleteMeetingSearchObj(
  meetingId: string
): Promise<void> {
  const [err] = await to(deleteObj('meetings', meetingId));
  if (err) {
    const msg = `${err.name} deleting meeting (${meetingId}) from Algolia`;
    throw new APIError(`${msg}: ${err.message}`, 500);
  }
}
