import { z } from 'zod';

import { Resource } from 'lib/model/resource';
import { User } from 'lib/model/user';
import { join } from 'lib/utils';

export const MatchTag = z.literal('meeting'); // Match has at least one meeting.
export const MatchHitTag = z.union([MatchTag, z.literal('not-meeting')]);
export const MATCH_TAGS: z.infer<typeof MatchTag>[] = ['meeting'];
export type MatchTag = z.infer<typeof MatchTag>;
export type MatchHitTag = z.infer<typeof MatchHitTag>;

/**
 * Represents a tutoring lesson or mentoring appointment.
 * @typedef {Object} MatchInterface
 * @property org - The ID of the organization that owns this request or match.
 * @property subjects - The subjects that this match is about (e.g. AP CS).
 * @property people - The people involved in this match (i.e. pupil and tutor).
 * @property creator - The person who created this match (e.g. pupil or admin).
 * @property message - A more detailed description of this match or request.
 */
export const Match = Resource.extend({
  org: z.string().default('default'),
  subjects: z.array(z.string()).default([]),
  people: z.array(User).default([]),
  creator: User.default(User.parse({})),
  message: z.string().default(''),
  tags: z.array(MatchTag).default([]),
  id: z.number().optional(),
});
export type Match = z.infer<typeof Match>;

export function matchToSegment(match: Match): Record<string, unknown> {
  return {
    id: match.id,
    message: match.message,
    subjects: match.subjects,
  };
}

export function matchToCSV(match: Match): Record<string, string> {
  const volunteer = match.people.find(
    (p) => p.roles.includes('tutor') || p.roles.includes('mentor')
  );
  const student = match.people.find(
    (p) => p.roles.includes('tutee') || p.roles.includes('mentee')
  );

  return {
    'Match ID': match.id,
    'Match Subjects': join(match.subjects),
    'Match Message': match.message,
    'Match Tags': join(match.tags),
    'Match Created': match.created.toString(),
    'Match Last Updated': match.updated.toString(),
    'Volunteer ID': volunteer?.id || '',
    'Volunteer Name': volunteer?.name || '',
    'Volunteer Photo URL': volunteer?.photo || '',
    'Student ID': student?.id || '',
    'Student Name': student?.name || '',
    'Student Photo URL': student?.photo || '',
  };
}
