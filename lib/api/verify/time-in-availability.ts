import { Timeslot, User } from 'lib/model';

/**
 * Verifies that the given times are included within the given people's
 * availability.
 * @param times - An array of timeslots that should be in the people's
 * availability.
 * @param people - The people whose availability should include `times`.
 * @return Nothing; throws an `APIError` if the given `times` are NOT within the
 * given `people`'s availability.
 * @todo Update this verification to account for recur times.
 */
export default function verifyTimesInAvailability(
  time: Timeslot,
  people: User[]
): void {}
