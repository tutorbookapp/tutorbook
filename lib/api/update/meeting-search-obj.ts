import to from 'await-to-js';

import { APIError } from 'lib/api/error';
import { Meeting } from 'lib/model/meeting';
import index from 'lib/api/algolia';

export default async function updateMeetingSearchObj(
  meeting: Meeting
): Promise<void> {
  const [e] = await to(index('meetings', meeting).wait());
  if (e) {
    const msg = `${e.name} updating meeting (${meeting.toString()}) in Algolia`;
    throw new APIError(`${msg}: ${e.message}`, 500);
  }
}
