import * as admin from 'firebase-admin';
import { ObjectWithObjectID } from '@algolia/client-search';
import { v4 as uuid } from 'uuid';

import {
  Availability,
  AvailabilityJSON,
  AvailabilitySearchHit,
} from '../availability';
import { Resource } from '../resource';
import construct from '../construct';

import { Base, BaseInterface } from './base';
import { Request, RequestJSON, RequestSearchHit } from './request';

type DocumentData = admin.firestore.DocumentData;
type DocumentSnapshot = admin.firestore.DocumentSnapshot;

/**
 * A venue for a tutoring or mentoring match to occur (e.g. Zoom or Jitsi).
 * @typedef {Object} Venue
 * @extends Resource
 * @property type - The type of venue (currently only Zoom or Jitsi).
 * @property url - The URL of the venue (right now, all venues are online and
 * thus have a definitive URL).
 */
export interface BaseVenue extends Resource {
  type: 'zoom' | 'jitsi';
  url: string;
}

/**
 * An anonymous Jitsi video conferencing room. Jitsi is an open-source software
 * that has a room for every single Zoom meeting venue.
 * @typedef {Object} JitsiVenue
 * @extends BaseVenue
 */
export interface JitsiVenue extends BaseVenue {
  type: 'jitsi';
}

/**
 * A recurring, non-scheduled Zoom meeting venue.
 * @typedef {Object} ZoomVenue
 * @extends BaseVenue
 * @property id - The Zoom meeting ID.
 * @property invite - The Zoom meeting invitation (that includes the meeting
 * URL, telephony audio phone numbers, the meeting topic, etc).
 */
export interface ZoomVenue extends BaseVenue {
  type: 'zoom';
  id: string;
  invite: string;
}

export type Venue = ZoomVenue | JitsiVenue;

/**
 * Represents a tutoring lesson or mentoring appointment.
 * @typedef {Object} MatchInterface
 * @extends RequestMatchBaseInterface
 * @property [request] - The request that was fulfilled by this match (if any).
 * @property venue - The meeting venue (e.g. Zoom or Jitsi) for this match.
 */
export interface MatchInterface extends BaseInterface {
  request?: Request;
  venue: Venue;
}

export type MatchJSON = Omit<MatchInterface, 'times' | 'request'> & {
  times?: AvailabilityJSON;
  request?: RequestJSON;
};

export type MatchSearchHit = ObjectWithObjectID &
  Omit<MatchInterface, 'times' | 'request'> & {
    times?: AvailabilitySearchHit;
    request?: RequestSearchHit;
  };

export class Match extends Base implements MatchInterface {
  public request?: Request;

  public venue: Venue = {
    type: 'jitsi',
    url: `https://meet.jit.si/${uuid()}`,
    created: new Date(),
    updated: new Date(),
  };

  public constructor(match: Partial<MatchInterface> = {}) {
    super(match);
    construct<MatchInterface>(this, match);
  }

  public toJSON(): MatchJSON {
    const { times, request, ...rest } = this;
    return {
      ...rest,
      times: times ? times.toJSON() : undefined,
      request: request ? request.toJSON() : undefined,
    };
  }

  /**
   * Creates a new `Match` object given the JSON representation of it.
   * @todo Convert Firestore document `path`s to `DocumentReference`s.
   */
  public static fromJSON(json: MatchJSON): Match {
    const { times, request, ...rest } = json;
    return new Match({
      ...rest,
      times: times ? Availability.fromJSON(times) : undefined,
      request: request ? Request.fromJSON(request) : undefined,
    });
  }

  public toFirestore(): DocumentData {
    const { times, request, ref, id, ...rest } = this;
    return {
      ...rest,
      times: times ? times.toFirestore() : undefined,
      request: request ? request.toFirestore() : undefined,
    };
  }

  public static fromFirestore(snapshot: DocumentSnapshot): Match {
    const matchData: DocumentData | undefined = snapshot.data();
    if (matchData) {
      const { times, request, ...rest } = matchData;
      return new Match({
        ...rest,
        times: times ? Availability.fromFirestore(times) : undefined,
        request: request ? Request.fromJSON(request) : undefined,
        ref: snapshot.ref,
        id: snapshot.id,
      });
    }
    console.warn(
      `[WARNING] Tried to create match (${snapshot.ref.id}) from ` +
        'non-existent Firestore document.'
    );
    return new Match();
  }

  public static fromSearchHit(hit: MatchSearchHit): Match {
    const { times, request, objectID, ...rest } = hit;
    return new Match({
      ...rest,
      times: times ? Availability.fromSearchHit(times) : undefined,
      request: request ? Request.fromSearchHit(request) : undefined,
      id: objectID,
    });
  }
}
