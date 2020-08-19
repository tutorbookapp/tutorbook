import { User } from '../user';

export type Role = 'parent' | 'tutor' | 'tutee' | 'mentor' | 'mentee';

export type UserWithRoles = User & { roles: Role[] };

/**
 * Represents a person that is involved in a request or match. Here, roles are
 * explicitly listed (unlike the `User` object where roles are implied by
 * role-specific properties).
 * @property id - The user's unique Firebase-assigned user ID (note that this
 * contains both lowercase and capital letters which is why it can't be used as
 * a unique anonymous email address handle).
 * @property [name] - The user's name (so we don't have to query an API just to
 * show an intelligible representation of this person).
 * @property [photo] - The user's photo URL (if any). This is included for the
 * same reason as above; speed on the front-end rendering. If not added by the
 * front-end, this is always updated by our back-end GCP function (triggered
 * when user documents are updated so as to keep profile info in sync).
 * @property handle - The user's all-lowercase anonymous email handle.
 * @property roles - The user's roles in this request or match (e.g. `tutor`).
 */
export interface Person {
  id: string;
  name?: string;
  photo?: string;
  handle: string;
  roles: Role[];
}
