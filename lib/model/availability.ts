import { z } from 'zod';

import { Timeslot, timeslotToString } from 'lib/model/timeslot';

export const Availability = z.array(Timeslot);
export type Availability = z.infer<typeof Availability>;
export type AvailabilityJSON = z.input<typeof Availability>;

export function availabilityToString(
  availability: Availability, 
  locale = 'en',
  timeZone = 'America/Los_Angeles',
  showTimeZone = false
): string {
  return availability.map((t) => timeslotToString(t, locale, timeZone, showTimeZone)).join(', ');
}
