import { z } from 'zod';

import { Timeslot, timeslotToString } from 'lib/model/timeslot';

export const Availability = z.array(Timeslot);
export type Availability = z.infer<typeof Availability>;

export function availabilityToString(
  availability: Availability,
  locale = 'en',
  timeZone?: string | null,
  showTimeZone = false
): string {
  return availability
    .map((t) =>
      timeslotToString(
        t,
        locale,
        timeZone || 'America/Los_Angeles',
        showTimeZone
      )
    )
    .join(', ');
}
