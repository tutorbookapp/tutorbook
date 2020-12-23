import to from 'await-to-js';

import { APIError } from 'lib/api/error';
import { Meeting } from 'lib/model';
import index from 'lib/api/algolia';

export default async function createMeetingSearchObj(
  meeting: Meeting
): Promise<void> {
  const [err] = await to(index('meetings', meeting));
  if (err) {
    const msg = `${err.name} saving meeting (${meeting.toString()}) to Algolia`;
    throw new APIError(`${msg}: ${err.message}`, 500);
  }
}
