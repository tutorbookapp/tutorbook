import * as admin from 'firebase-admin';
import { ObjectWithObjectID } from '@algolia/client-search';

import {
  Availability,
  AvailabilityJSON,
  AvailabilitySearchHit,
} from '../availability';
import construct from '../construct';

import { Base, BaseInterface } from './base';

type DocumentData = admin.firestore.DocumentData;
type DocumentSnapshot = admin.firestore.DocumentSnapshot;

export type RequestStatus = 'created' | 'queued' | 'matched';

/**
 * A request is a job post. Typically created by parents or teachers.
 * @typedef {Object} RequestInterface
 * @extends RequestMatchBaseInterface
 * @property people - Student(s) who need help (e.g. "Nicholas Chiang").
 * @property subjects - What the student needs help with (e.g. "AP CS A").
 * @property creator - Person who created the request (typically a parent or
 * teacher but it could also be an admin or the student themselves).
 * @property message - What specifically the student is struggling with (e.g.
 * "Nicholas doesn't understand Java arrays and sorting algorithms").
 * @property [times] - Requested timeslots when (tutoring/mentoring) meetings
 * should occur (i.e. the times that work best for the student). For now, each
 * of these timeslots has the default weekly recurrance.
 * @property status - Whether the request is in the matching queue or has been
 * already matched (this is used to create a 3-step "matching pipeline").
 */
export interface RequestInterface extends BaseInterface {
  status: RequestStatus;
}

export type RequestJSON = Omit<RequestInterface, 'times'> & {
  times?: AvailabilityJSON;
};

export type RequestSearchHit = ObjectWithObjectID &
  Omit<RequestInterface, 'times'> & { times?: AvailabilitySearchHit };

export class Request extends Base implements RequestInterface {
  public status: RequestStatus = 'created';

  public constructor(request: Partial<RequestInterface> = {}) {
    super(request);
    construct<RequestInterface>(this, request);
  }

  public toJSON(): RequestJSON {
    const { times, ref, ...rest } = this;
    if (times) return { ...rest, times: times.toJSON() };
    return rest;
  }

  public static fromJSON(json: RequestJSON): Request {
    const { times, ...rest } = json;
    if (times)
      return new Request({ ...rest, times: Availability.fromJSON(times) });
    return new Request(rest);
  }

  public toFirestore(): DocumentData {
    const { times, ref, id, ...rest } = this;
    if (times) return { ...rest, times: times.toFirestore() };
    return rest;
  }

  public static fromFirestore(snapshot: DocumentSnapshot): Request {
    const requestData: DocumentData | undefined = snapshot.data();
    if (requestData) {
      const { times, ...rest } = requestData;
      return new Request({
        ...rest,
        times: times ? Availability.fromFirestore(times) : undefined,
        ref: snapshot.ref,
        id: snapshot.id,
      });
    }
    console.warn(
      `[WARNING] Tried to create request (${snapshot.ref.id}) from ` +
        'non-existent Firestore document.'
    );
    return new Request();
  }

  public static fromSearchHit(hit: RequestSearchHit): Request {
    const { times, objectID, ...rest } = hit;
    return new Request({
      ...rest,
      times: times ? Availability.fromSearchHit(times) : undefined,
      id: objectID,
    });
  }
}
