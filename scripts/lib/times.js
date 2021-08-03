/**
 * Returns the closest 15 min increment to a given start time but never goes
 * back in time (e.g. 9:41am becomes 9:45am, 9:56am becomes 10:00am).
 * @param start - The unrounded start time (e.g. 9:41am, 9:56am).
 * @param [interval] - The increment to round to in mins; default 15 mins.
 * @return The start time rounded up to the nearest 15 min interval.
 */
function roundStartTime(start, interval = 15) {
  return new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
    start.getHours(),
    Math.ceil(start.getMinutes() / interval) * interval
  );
}

/**
 * Slices the given availability into timeslots of the given duration at given
 * intervals. Rounds the availability start to ensure round timeslot starts.
 * @param availability - The availability to slice into smaller timeslots.
 * @param [interval] - Minutes between slice start times. Defaults to 15 mins.
 * @param [duration] - The slice duration in minutes. Defaults to 60 mins.
 * @return The availability sliced into timeslots of the given duration whose
 * start times are each the given interval apart.
 */
function sliceAvailability(availability, interval = 15, duration = 60) {
  const sliced = [];
  const minsToMillis = 60 * 1000;
  availability
    .sort((a, b) => a.from.valueOf() - b.from.valueOf())
    .forEach((timeslot) => {
      let from = roundStartTime(timeslot.from, interval);
      while (
        from.valueOf() <=
        timeslot.to.valueOf() - duration * minsToMillis
      ) {
        const to = new Date(from.valueOf() + duration * minsToMillis);
        sliced.push({ from, to });
        from = new Date(from.valueOf() + interval * minsToMillis);
      }
    });
  return sliced;
}

/**
 * Returns the next date from 1970-01-01T00:00:00Z (the origin of the Unix
 * timestamp) or a given date that has the given times.
 * @see {@link https://en.wikipedia.org/wiki/Unix_time}
 * @param hours - The hours that the returned date should have.
 * @param [minutes=0] - The minutes that the returned date should have.
 * @param [seconds=0] - The seconds that the returned date should have.
 * @param [milliseconds=0] - The milliseconds that the returned date should have.
 * @param [reference] - The date we should start from. Default is UTC 0.
 */
function getDateWithTime(
  hours,
  minutes = 0,
  seconds = 0,
  milliseconds = 0,
  reference = new Date(0)
) {
  return new Date(
    reference.getFullYear(),
    reference.getMonth(),
    reference.getDate(),
    hours,
    minutes,
    seconds,
    milliseconds
  );
}

/**
 * Returns the next date (from a given date) that has the given day (does not
 * change the times on the given date).
 * @param day - The integer representing the desired day (e.g. 0 for Sunday).
 * @param [reference] - The date we should start from. Default is UTC 0.
 * @todo Why do we have a counter (originally from `@tutorboook/utils`)?
 */
function getDateWithDay(weekday, reference = new Date(0)) {
  const date = new Date(reference.valueOf());
  let count = 0; // TODO: Why did we add this counter in `lib/utils`?
  while (date.getDay() !== weekday && count <= 256) {
    date.setDate(date.getDate() + 1);
    count += 1;
  }
  return date;
}

/**
 * Helper function that combines `getDateWithTime` and `getNextDateWithDay` to
 * produce a function that returns a `Date` representing a weekly recurring
 * timestamp (i.e. the first occurance of the desired time as a Unix time).
 */
function getDate(
  weekday,
  hours,
  minutes = 0,
  seconds = 0,
  milliseconds = 0,
  reference = new Date(0)
) {
  return getDateWithDay(
    weekday,
    getDateWithTime(hours, minutes, seconds, milliseconds, reference)
  );
}

/**
 * Gets the next date (in the future) with the given date's:
 * - Weekday (Mo/Tu/We/Thu/Fri/Sat/Sun)
 * - Time (HR:MIN:SS)
 * @param date - The date to match weekday and time.
 */
function nextDateWithDayAndTime(date) {
  return getDate(
    date.getDay(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
    new Date()
  );
}

/**
 * @param timeslot - The timeslot to check for overlap.
 * @param [allowBackToBack] - If true, this will allow the timeslots to touch
 * (but not overlap). Defaults to false.
 * @return Whether this availability overlaps at all with the given timeslot.
 */
function overlaps(availability, timeslot, allowBackToBack = false) {
  return availability.some((t) => {
    if (allowBackToBack) return t.to > timeslot.from && t.from < timeslot.to;
    return t.to >= timeslot.from && t.from <= timeslot.to;
  });
}

/**
 * Generate the user's `_availability` for the next time window (e.g. 3 months).
 * Excludes a time when the user has meetings for every instance of that time in
 * the next time window (e.g. if a volunteer has a meeting on every Monday at 11
 * AM for the next 3 months, then we exclude Mondays at 11 AM).
 * @param availability - The user's availability (to slice and filter).
 * @param booked - Booked availability slots (i.e. meeting times).
 * @param [until] - The end date of the time window. Defaults to a date exactly
 * 3 months from now.
 * @param [interval] - Minutes between slice start times. Defaults to 15 mins.
 * @param [duration] - The slice duration in minutes. Defaults to 60 mins.
 * @return An array of valid timeslot start times to be stored in Algolia.
 */
function getAlgoliaAvailability(
  availability,
  booked,
  until,
  interval = 15,
  duration = 60
) {
  const sliced = sliceAvailability(availability, interval, duration);
  const filtered = sliced.filter((timeslot) => {
    let from = nextDateWithDayAndTime(timeslot.from);
    while (from.valueOf() <= until.valueOf() + timeslot.duration) {
      const to = new Date(from.valueOf() + timeslot.duration);
      // If any one of the time's instances in the next 3 months can be booked
      // (i.e. it's not already booked), we include the time in Algolia.
      if (!overlaps(booked, { from, to }, true)) return true;
      from = new Date(from.valueOf() + 7 * 24 * 60 * 60 * 1000);
    }
    // Otherwise, we know that every single one of the time's instances in the
    // next 3 months has been booked and thus exclude the time in Algolia.
    return false;
  });
  return filtered.map((timeslot) => timeslot.from.valueOf());
}

module.exports = getAlgoliaAvailability;
