import * as admin from 'firebase-admin';

import {
  Resource,
  ResourceFirestore,
  ResourceInterface,
  ResourceJSON,
} from 'lib/model/resource';
import { Role, UserTag } from 'lib/model/user';
import { MeetingTag } from 'lib/model/meeting';
import clone from 'lib/utils/clone';
import construct from 'lib/model/construct';
import definedVals from 'lib/model/defined-vals';

type DocumentSnapshot = admin.firestore.DocumentSnapshot;
type Timestamp = admin.firestore.Timestamp;

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
  tutor: TagTotals<Exclude<UserTag, Role>>;
  tutee: TagTotals<Exclude<UserTag, Role>>;
  parent: TagTotals<Exclude<UserTag, Role>>;
  meeting: TagTotals<MeetingTag>;
  date: Date;
  id: string;
}

export type AnalyticsJSON = Omit<AnalyticsInterface, keyof Resource | 'date'> &
  ResourceJSON & { date: string };
export type AnalyticsFirestore = Omit<
  AnalyticsInterface,
  keyof Resource | 'date'
> &
  ResourceFirestore & { date: Timestamp };

export class Analytics extends Resource implements AnalyticsInterface {
  public tutor: TagTotals<Exclude<UserTag, Role>> = {
    total: 0,
    vetted: 0,
    meeting: 0,
  };

  public tutee: TagTotals<Exclude<UserTag, Role>> = {
    total: 0,
    vetted: 0,
    meeting: 0,
  };

  public parent: TagTotals<Exclude<UserTag, Role>> = {
    total: 0,
    vetted: 0,
    meeting: 0,
  };

  public meeting: TagTotals<MeetingTag> = { total: 0, recurring: 0 };

  public date: Date = new Date();

  public id = '';

  public constructor(analytics: Partial<AnalyticsInterface> = {}) {
    super(analytics);
    construct<AnalyticsInterface, ResourceInterface>(
      this,
      analytics,
      new Resource()
    );
  }

  public get clone(): Analytics {
    return new Analytics(clone(this));
  }

  public toJSON(): AnalyticsJSON {
    const { date, ...rest } = this;
    return definedVals({
      ...rest,
      ...super.toJSON(),
      date: date.toJSON(),
    });
  }

  public static fromJSON({ date, ...rest }: AnalyticsJSON): Analytics {
    return new Analytics({
      ...rest,
      ...Resource.fromJSON(rest),
      date: new Date(date),
    });
  }

  public toFirestore(): AnalyticsFirestore {
    const { date, ...rest } = this;
    return definedVals({
      ...rest,
      ...super.toFirestore(),
      date: (date as unknown) as Timestamp,
    });
  }

  public static fromFirestore({
    date,
    ...rest
  }: AnalyticsFirestore): Analytics {
    return new Analytics({
      ...rest,
      ...Resource.fromFirestore(rest),
      date: date.toDate(),
    });
  }

  public static fromFirestoreDoc(snapshot: DocumentSnapshot): Analytics {
    if (!snapshot.exists) return new Analytics();
    const overrides = definedVals({
      created: snapshot.createTime?.toDate(),
      updated: snapshot.updateTime?.toDate(),
      id: snapshot.id,
    });
    const analytics = Analytics.fromFirestore(
      snapshot.data() as AnalyticsFirestore
    );
    return new Analytics({ ...analytics, ...overrides });
  }
}
