import { APIError } from 'lib/api/error';
import { Meeting } from 'lib/model';

// TODO: Verifies the given creator is either:
// - The creator of the given meeting's match, OR;
// - The meeting's match already exists (i.e. was created by someone else).
export default function verifyMeetingCreator(meeting: Meeting): void {
  if (meeting.creator.id !== meeting.match.creator.id) {
    const msg =
      `Match creator (${meeting.match.creator.id}) must match meeting ` +
      `creator (${meeting.creator.id})`;
    throw new APIError(msg, 400);
  }
}
