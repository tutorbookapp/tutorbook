import { nanoid } from 'nanoid';

import { Match, UserWithRoles, Venue } from 'lib/model';

// TODO: Actually update the given Zoom venue to match the updated match.
export default async function updateZoom(
  match: Match,
  people: UserWithRoles[]
): Promise<Venue> {
  return (
    match.venue || {
      type: 'jitsi',
      url: `https://meet.jit.si/TB-${nanoid(10)}`,
      created: new Date(),
      updated: new Date(),
    }
  );
}
