import * as admin from 'firebase-admin';

import { ObjectWithObjectID } from '@algolia/client-search';
import {
  Request,
  RequestSearchHit,
  RequestJSON,
  RequestInterface,
} from './request';
import {
  Availability,
  AvailabilityJSON,
  AvailabilitySearchHit,
} from './availability';

import construct from './construct';

type DocumentData = admin.firestore.DocumentData;
type DocumentSnapshot = admin.firestore.DocumentSnapshot;

export interface Venue {
  url: string;
}

/**
 * Represents a tutoring lesson or mentoring appointment.
 * @property [request] - The request that was fulfilled by this match (if any).
 * @property [bramble] - The URL to the Bramble virtual tutoring room (only
 * populated when the match is for tutoring).
 * @property [jitsi] - The URL to the Jitsi video conferencing room (only
 * populated when the match is for mentoring).
 */
export interface MatchInterface extends RequestInterface {
  request?: Request;
  bramble?: Venue;
  jitsi?: Venue;
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

export class Match extends Request implements MatchInterface {
  public request?: Request;

  public bramble?: Venue;

  public jitsi?: Venue;

  public constructor(match: Partial<MatchInterface> = {}) {
    super(match);
    construct<MatchInterface>(this, match, new Request());
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
