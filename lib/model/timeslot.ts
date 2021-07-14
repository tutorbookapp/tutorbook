import { nanoid } from 'nanoid';
import { z } from 'zod';

export const date = z.string().or(z.date()).refine((s) => !Number.isNaN(new Date(s).valueOf())).transform((s) => new Date(s));

/**
 * A timeslot is a window of time and provides all the necessary scheduling data
 * for any scenario (including support for complex rrules used server-side).
 * @typedef {Object} TimeslotInterface
 * @property id - A unique identifier for this timeslot (used as React keys and
 * thus only stored client-side as we have no use for this on our server).
 * @property from - The start time of this particular timeslot instance.
 * @property to - The end time of this particular timeslot instance.
 * @property [exdates] - Dates to exclude from the timeslot's recurrence rule.
 * @property [recur] - The timeslot's recurrence rule (as an iCal RFC string).
 * @property [last] - The timeslot's last possible end time. Undefined
 * client-side; only used server-side for querying recurring timeslots.
 */
export const Timeslot = z.object({
  id: z.string().default(() => nanoid(5)),
  from: date.default(() => new Date()),
  to: date.default(() => new Date()),
  exdates: z.array(date).optional(),
  recur: z.string().optional(),
  last: date.optional(),
});
export type Timeslot = z.infer<typeof Timeslot>;

export function timeslotToString(
  t: Timeslot,
  locale = 'en',
  timeZone = 'America/Los_Angeles',
  showTimeZone = false
): string {
  const hideAMPM =
    (t.from.getHours() >= 12 && t.to.getHours() >= 12) ||
    (t.from.getHours() < 12 && t.to.getHours() < 12);
  const showSecondDate =
    t.from.getDate() !== t.to.getDate() ||
    t.from.getMonth() !== t.to.getMonth() ||
    t.from.getFullYear() !== t.to.getFullYear();

  // We follow Google's Material Design guidelines while formatting these
  // durations. We use an en dash without spaces between the time range.
  // @see {@link https://material.io/design/communication/data-formats.html}
  return `${t.from
    .toLocaleString(locale, {
      timeZone: timeZone || 'America/Los_Angeles',
      weekday: 'long',
      hour: 'numeric',
      minute: 'numeric',
    })
    .replace(hideAMPM && !showSecondDate ? ' AM' : '', '')
    .replace(
      hideAMPM && !showSecondDate ? ' PM' : '',
      ''
    )}–${t.to.toLocaleString(locale, {
    timeZone: timeZone || 'America/Los_Angeles',
    weekday: showSecondDate ? 'long' : undefined,
    hour: 'numeric',
    minute: 'numeric',
    timeZoneName: showTimeZone ? 'short' : undefined,
  })}`;
}
