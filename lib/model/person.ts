import { isArray, isJSON } from 'lib/model/json';

export type Role = 'tutor' | 'tutee' | 'mentor' | 'mentee';

export function isRole(role: unknown): role is Role {
  if (typeof role !== 'string') return false;
  return ['tutor', 'tutee', 'mentor', 'mentee'].includes(role);
}

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

export function isPerson(json: unknown): json is Person {
  if (!isJSON(json)) return false;
  if (typeof json.id !== 'string') return false;
  if (json.name && typeof json.name !== 'string') return false;
  if (json.photo && typeof json.photo !== 'string') return false;
  if (typeof json.handle !== 'string') return false;
  if (!isArray(json.roles, isRole)) return false;
  return true;
}
