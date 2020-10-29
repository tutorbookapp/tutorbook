import { nanoid } from 'nanoid';

import {
  Resource,
  ResourceFirestore,
  ResourceInterface,
  ResourceJSON,
  isResourceJSON,
} from 'lib/model/resource';
import construct from 'lib/model/construct';
import { isJSON } from 'lib/model/json';

export type VenueType = 'zoom' | 'jitsi';

/**
 * A venue for a tutoring or mentoring match to occur (e.g. Zoom or Jitsi).
 * @typedef {Object} Venue
 * @extends Resource
 * @property type - The type of venue (currently only Zoom or Jitsi).
 * @property url - The URL of the venue (right now, all venues are online and
 * thus have a definitive URL).
 */
export interface VenueInterface extends ResourceInterface {
  id: string;
  url: string;
  invite: string;
  type: VenueType;
}

export type VenueJSON = Omit<VenueInterface, keyof Resource> & ResourceJSON;

export type VenueFirestore = Omit<VenueInterface, keyof Resource> &
  ResourceFirestore;

export function isVenueJSON(json: unknown): json is VenueJSON {
  if (!isResourceJSON(json)) return false;
  if (!isJSON(json)) return false;
  if (typeof json.url !== 'string') return false;
  if (json.type === 'zoom') {
    if (typeof json.id !== 'string') return false;
    if (typeof json.invite !== 'string') return false;
  } else if (json.type !== 'jitsi') {
    return false;
  }
  return true;
}

export class Venue extends Resource implements VenueInterface {
  public id = nanoid(10);

  public url = `https://meet.jit.si/TB-${this.id}`;

  public invite = `Go to ${this.url} to join your meeting.`;

  public type: VenueType = 'jitsi';

  public constructor(venue: Partial<VenueInterface> = {}) {
    super(venue);
    construct<VenueInterface, ResourceInterface>(this, venue, new Resource());
  }

  public toJSON(): VenueJSON {
    return { ...this, ...super.toJSON() };
  }

  public static fromJSON(json: VenueJSON): Venue {
    return new Venue({ ...json, ...Resource.fromJSON(json) });
  }

  public static fromFirestore(data: VenueFirestore): Venue {
    return new Venue({ ...data, ...Resource.fromFirestore(data) });
  }
}
