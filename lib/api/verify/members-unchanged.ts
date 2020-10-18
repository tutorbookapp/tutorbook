import { dequal } from 'dequal';

import { APIError } from 'lib/api/error';
import { Org } from 'lib/model';

/**
 * Verifies that the org members were not changed.
 * @param prev - The old org.
 * @param updated - The updated org (whose `members` must be the same as that of
 * `prev`).
 * @return Nothing; throws an `APIError` if the org's members changed.
 */
export default function membersUnchanged(prev: Org, updated: Org): void {
  if (!dequal(prev.members, updated.members)) {
    const msg = `Organization (${updated.toString()}) members can't be updated`;
    throw new APIError(msg, 400);
  }
}
