import * as admin from 'firebase-admin';
import { ObjectWithObjectID } from '@algolia/client-search';

import {
  Resource,
  ResourceFirestore,
  ResourceInterface,
  ResourceJSON,
  ResourceSearchHit,
} from 'lib/model/resource';
import { MatchTag } from 'lib/model/match';
import { MeetingTag } from 'lib/model/meeting';
import { Role } from 'lib/model/person';
import { UserTag } from 'lib/model/user';
import clone from 'lib/utils/clone';
import construct from 'lib/model/construct';
import definedVals from 'lib/model/defined-vals';

type DocumentSnapshot = admin.firestore.DocumentSnapshot;
type DocumentReference = admin.firestore.DocumentReference;

/**
 * @typedef {Object} TagTotals
 * @description We collect totals based on data model tags. Because they're
 * filterable tags, org admins can then filter and see what's in these totals.
 */
export type TagTotals<Tag extends string> = { total: number } & {
  [key in Tag]: number;
};

/**
 * @typedef {Object} Analytics
 * @extends Resource
 * @description A day of org analytics. Created when the first even triggers and
 * is updated until 24 hours have passed (and a new analytics doc is created).
 */
export interface AnalyticsInterface extends ResourceInterface {
  mentor: TagTotals<Exclude<UserTag, Role>>;
  mentee: TagTotals<Exclude<UserTag, Role>>;
  tutor: TagTotals<Exclude<UserTag, Role>>;
  tutee: TagTotals<Exclude<UserTag, Role>>;
  match: TagTotals<MatchTag>;
  meeting: TagTotals<MeetingTag>;
  ref?: DocumentReference;
  id: string;
}

export type AnalyticsJSON = Omit<AnalyticsInterface, keyof Resource> &
  ResourceJSON;
export type AnalyticsSearchHit = ObjectWithObjectID &
  Omit<AnalyticsInterface, keyof Resource | 'id'> &
  ResourceSearchHit;
export type AnalyticsFirestore = Omit<AnalyticsInterface, keyof Resource> &
  ResourceFirestore;

export class Analytics extends Resource implements AnalyticsInterface {
  public mentor: TagTotals<Exclude<UserTag, Role>> = {
    total: 0,
    vetted: 0,
    matched: 0,
    meeting: 0,
  };

  public mentee: TagTotals<Exclude<UserTag, Role>> = {
    total: 0,
    vetted: 0,
    matched: 0,
    meeting: 0,
  };

  public tutor: TagTotals<Exclude<UserTag, Role>> = {
    total: 0,
    vetted: 0,
    matched: 0,
    meeting: 0,
  };

  public tutee: TagTotals<Exclude<UserTag, Role>> = {
    total: 0,
    vetted: 0,
    matched: 0,
    meeting: 0,
  };

  public match: TagTotals<MatchTag> = { total: 0, meeting: 0 };

  public meeting: TagTotals<MeetingTag> = { total: 0, recurring: 0 };

  public id = '';

  public ref?: DocumentReference;

  public constructor(match: Partial<AnalyticsInterface> = {}) {
    super(match);
    construct<AnalyticsInterface, ResourceInterface>(
      this,
      match,
      new Resource()
    );
  }

  public get clone(): Analytics {
    return new Analytics(clone(this));
  }

  public toJSON(): AnalyticsJSON {
    return definedVals({ ...this, ...super.toJSON(), ref: undefined });
  }

  public static fromJSON(json: AnalyticsJSON): Analytics {
    return new Analytics({ ...json, ...Resource.fromJSON(json) });
  }

  public toFirestore(): AnalyticsFirestore {
    return definedVals({ ...this, ...super.toFirestore(), ref: undefined });
  }

  public static fromFirestore(data: AnalyticsFirestore): Analytics {
    return new Analytics({ ...data, ...Resource.fromFirestore(data) });
  }

  public static fromFirestoreDoc(snapshot: DocumentSnapshot): Analytics {
    if (!snapshot.exists) return new Analytics();
    const overrides = definedVals({
      created: snapshot.createTime?.toDate(),
      updated: snapshot.updateTime?.toDate(),
      ref: snapshot.ref,
      id: snapshot.id,
    });
    const match = Analytics.fromFirestore(
      snapshot.data() as AnalyticsFirestore
    );
    return new Analytics({ ...match, ...overrides });
  }

  public toSearchHit(): AnalyticsSearchHit {
    const { id, ...rest } = this;
    return definedVals({
      ...rest,
      ...super.toSearchHit(),
      ref: undefined,
      id: undefined,
      objectID: id,
    });
  }

  public static fromSearchHit({
    objectID,
    ...hit
  }: AnalyticsSearchHit): Analytics {
    return new Analytics({
      ...hit,
      ...Resource.fromSearchHit(hit),
      id: objectID,
    });
  }
}
