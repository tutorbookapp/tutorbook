import { z } from 'zod';

import { Account } from 'lib/model/account';
import { Aspect } from 'lib/model/aspect';
import { Availability } from 'lib/model/availability';
import { Verification } from 'lib/model/verification';
import { join } from 'lib/utils';

export const Role = z.union([
  z.literal('tutor'),
  z.literal('tutee'),
  z.literal('mentor'),
  z.literal('mentee'),
  z.literal('parent'),
]);
export type Role = z.infer<typeof Role>;

/**
 * Various tags that are added to the Algolia users search during indexing (via
 * the `lib/api/algolia.ts` API back-end module). For in-depth explanations of
 * each one, reference the link included below.
 * @see {@link https://github.com/tutorbookapp/tutorbook/tree/TAGS.md}
 */
export const UserTag = z.union([
  z.literal('vetted'),
  z.literal('matched'),
  z.literal('meeting'),
  Role,
]);
export const UserHitTag = z.union([
  UserTag,
  z.literal('not-tutor'),
  z.literal('not-tutee'),
  z.literal('not-mentor'),
  z.literal('not-mentee'),
  z.literal('not-parent'),
  z.literal('not-vetted'),
  z.literal('not-matched'),
  z.literal('not-meeting'),
]);
export const USER_TAGS: UserTag[] = [
  'tutor',
  'tutee',
  'mentor',
  'mentee',
  'parent',
  'vetted',
  'matched',
  'meeting',
];
export type UserTag = z.infer<typeof UserTag>;
export type UserHitTag = z.infer<typeof UserHitTag>;

/**
 * A user object (that is stored in their Firestore profile document by uID).
 * @typedef {Object} UserInterface
 * @extends AccountInterface
 * @property [age] - The user's age (mostly used for students).
 * @property orgs - An array of the IDs of the orgs this user belongs to.
 * @property zooms - An array of Zoom user accounts. These are used when
 * creating Zoom meetings for a match. Each TB user can have multiple Zoom user
 * accounts managed by different orgs; we use the Zoom account belonging to the
 * org that owns the match when creating Zoom meetings for said match.
 * @property availability - An array of `Timeslot`'s when the user is free.
 * @property mentoring - The subjects that the user wants a and can mentor for.
 * @property tutoring - The subjects that the user wants a and can tutor for.
 * @property langs - The languages (as ISO codes) the user can speak fluently.
 * @property parents - The Firebase uIDs of linked parent accounts.
 * @property visible - Whether or not this user appears in search results.
 * @property featured - Aspects in which this user is first in search results.
 * @property roles - Always empty unless in context of match or request.
 * @property tags - An array of user tags used for analytics and filtering.
 * @property reference - How the user heard about TB or the org they're joining.
 * @property timezone - The user's time zone (e.g. America/Los_Angeles). This is
 * collected by our front-end and used by our back-end when sending reminders.
 * @property [token] - The user's Firebase Authentication JWT `idToken`.
 * @property [hash] - The user's Intercom HMAC for identity verifications.
 * @todo Add a `zoom` prop that contains the user's personal Zoom OAuth token
 * (e.g. for freelancers who want to user their own Zoom account when creating
 * meetings).
 */
export const User = Account.extend({
  age: z.number().nullable().default(null),
  orgs: z.array(z.string()).default([]),
  availability: Availability.default([]),
  mentoring: z.array(z.string()).default([]),
  tutoring: z.array(z.string()).default([]),
  langs: z.array(z.string()).default(['en']),
  parents: z.array(z.string()).default([]),
  verifications: z.array(Verification).default([]),
  visible: z.boolean().default(false),
  featured: z.array(Aspect).default([]),
  roles: z.array(Role).default([]),
  tags: z.array(UserTag).default([]),
  reference: z.string().default(''),
  timezone: z.string().nullable().default(null),
  token: z.string().optional(),
  hash: z.string().optional(),
});
export type User = z.infer<typeof User>;
export type UserJSON = z.input<typeof User>;

export function userToCSV(user: User): Record<string, string> {
  return {
    'User ID': user.id,
    'User Name': user.name,
    'User Email': user.email || '',
    'User Phone': user.phone || '',
    'User Bio': user.bio,
    'User Reference': user.reference,
    'User Languages': join(user.langs),
    'User Tags': join(user.tags),
    'Mentoring Subjects': join(user.mentoring),
    'Tutoring Subjects': join(user.tutoring),
    'Profile Image URL': user.photo || '',
    'Banner Image URL': user.background || '',
    'Venue URL': user.venue || '',
    'Website URL': user.socials.find((s) => s.type === 'website')?.url || '',
    'LinkedIn URL': user.socials.find((s) => s.type === 'linkedin')?.url || '',
    'Twitter URL': user.socials.find((s) => s.type === 'twitter')?.url || '',
    'Facebook URL': user.socials.find((s) => s.type === 'facebook')?.url || '',
    'Instagram URL':
      user.socials.find((s) => s.type === 'instagram')?.url || '',
    'GitHub URL': user.socials.find((s) => s.type === 'github')?.url || '',
    'IndieHackers URL':
      user.socials.find((s) => s.type === 'indiehackers')?.url || '',
    'User Created': user.created.toString(),
    'User Last Updated': user.updated.toString(),
  };
}
