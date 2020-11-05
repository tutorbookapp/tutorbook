import rfdc from 'rfdc';

import {
  Availability,
  Timeslot,
  Venue,
  Verification,
  ZoomUser,
} from 'lib/model';

const deepClone = rfdc();

function cloneTime(time: Timeslot): Timeslot {
  return new Timeslot(deepClone(time));
}

function cloneTimes(times: Availability): Availability {
  return new Availability(...times.map(cloneTime));
}

// TODO: Create a more general, reusable function to clone all data model objs.
function cloneVerification(verification: Verification): Verification {
  return new Verification(deepClone(verification));
}

function cloneVenue(venue: Venue): Venue {
  return new Venue(deepClone(venue));
}

function cloneZoomUser(user: ZoomUser): ZoomUser {
  return new ZoomUser(deepClone(user));
}

interface Temp {
  availability: Availability;
  time: Timeslot;
  venue: Venue;
  zooms: ZoomUser[];
  verifications: Verification[];
}

// TODO: Perhaps try to get rid of all of these weird type workarounds.
export default function clone<T>(obj: T): T {
  const copy = (deepClone(obj) as unknown) as Temp;
  const orig = (obj as unknown) as Temp;
  if (orig.availability) copy.availability = cloneTimes(orig.availability);
  if (orig.time) copy.time = cloneTime(orig.time);
  if (orig.venue) copy.venue = cloneVenue(orig.venue);
  if (orig.zooms) copy.zooms = orig.zooms.map(cloneZoomUser);
  if (orig.verifications)
    copy.verifications = orig.verifications.map(cloneVerification);
  return (copy as unknown) as T;
}
