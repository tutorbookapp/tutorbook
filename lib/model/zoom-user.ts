import {
  Resource,
  ResourceFirestore,
  ResourceInterface,
  ResourceJSON,
  isResourceJSON,
} from 'lib/model/resource';
import { isArray, isJSON } from 'lib/model/json';
import construct from 'lib/model/construct';

/**
 * A user's Zoom account that belongs to a certain org.
 * @typedef {Object} ZoomUser
 * @extends Resource
 * @property id - The Zoom-assigned user ID.
 * @property email - The email address used with the Zoom user account.
 * @property org - The ID of the TB org under which this Zoom user belongs.
 */
export interface ZoomUserInterface extends ResourceInterface {
  id: string;
  email: string;
  org: string;
}

export type ZoomUserJSON = Omit<ZoomUserInterface, keyof Resource> &
  ResourceJSON;
export type ZoomUserFirestore = Omit<ZoomUserInterface, keyof Resource> &
  ResourceFirestore;

export function isZoomUserJSON(json: unknown): json is ZoomUserJSON {
  if (!isResourceJSON(json)) return false;
  if (!isJSON(json)) return false;
  if (typeof json.id !== 'string') return false;
  if (typeof json.email !== 'string') return false;
  if (typeof json.org !== 'string') return false;
  return true;
}

export function zoomsFromFirestore(data: unknown): ZoomUser[] {
  if (!isArray(data)) return [];
  return data.map((z: unknown) => {
    return ZoomUser.fromFirestore(z as ZoomUserFirestore);
  });
}

export class ZoomUser extends Resource implements ZoomUserInterface {
  public id = '';

  public email = '';

  public org = 'default';

  public constructor(user: Partial<ZoomUserInterface>) {
    super(user);
    construct<ZoomUserInterface, ResourceInterface>(this, user, new Resource());
  }

  public toJSON(): ZoomUserJSON {
    return { ...this, ...super.toJSON() };
  }

  public static fromJSON(json: ZoomUserJSON): ZoomUser {
    return new ZoomUser({ ...json, ...Resource.fromJSON(json) });
  }

  public toFirestore(): ZoomUserFirestore {
    return { ...this, ...super.toFirestore() };
  }

  public static fromFirestore(data: ZoomUserFirestore): ZoomUser {
    return new ZoomUser({ ...data, ...Resource.fromFirestore(data) });
  }
}
