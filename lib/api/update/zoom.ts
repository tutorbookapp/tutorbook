import { nanoid } from 'nanoid';

import { Meeting, User, Venue } from 'lib/model';

export default async function updateZoom(
  meeting: Meeting,
  people: User[]
): Promise<Venue> {
  return (
    meeting.venue || {
      type: 'jitsi',
      url: `https://meet.jit.si/TB-${nanoid(10)}`,
      created: new Date(),
      updated: new Date(),
    }
  );
}
