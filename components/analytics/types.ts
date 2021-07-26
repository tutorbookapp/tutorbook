/**
 * @typedef {Object} AnalyticsSnapshot
 * @description Snapshot of analytics at a given point in time.
 * @property date - The date in milliseconds form.
 * @property volunteers - Total number of volunteers.
 * @property students - Total number of students.
 * @property matches - Total number of matches.
 * @property meetings - Total number of meetings.
 */
export interface AnalyticsSnapshot {
  date: number;
  volunteers: number;
  students: number;
  matches: number;
  meetings: number;
}

/**
 * @typedef {Object} AnalyticsRes
 * @description Data that powers the org overview page. Calculated based on the
 * `Analytics` objects stored in the `/org/<orgId>/analytics` subcollection.
 */
export interface AnalyticsRes {
  volunteers: { change: number; total: number; matched: number };
  students: { change: number; total: number; matched: number };
  matches: { change: number; total: number; perVolunteer: number };
  meetings: { change: number; total: number; recurring: number };
  timeline: AnalyticsSnapshot[];
}
