import { nanoid } from 'nanoid';

import {
  DBDate,
  DBTimeslot,
  Timeslot,
  TimeslotJSON,
  isTimeslotJSON,
} from 'lib/model/timeslot';
import { DBPerson, Role, User, UserJSON, isUserJSON } from 'lib/model/user';
import {
  Resource,
  ResourceInterface,
  ResourceJSON,
  isResourceJSON,
} from 'lib/model/resource';
import { Subject, isSubject } from 'lib/model/subject';
import { isArray, isJSON } from 'lib/model/json';
import { join, notTags } from 'lib/utils';
import clone from 'lib/utils/clone';
import construct from 'lib/model/construct';
import definedVals from 'lib/model/defined-vals';

export type MeetingTag = 'recurring'; // Meeting is recurring (has rrule).

export type DBMeetingTag = MeetingTag | 'not-recurring';

export const MEETING_TAGS: MeetingTag[] = ['recurring'];

export function isMeetingTag(tag: unknown): tag is MeetingTag {
  return tag === 'recurring';
}

/**
 * @typedef MeetingAction
 * @description Action to take when updating recurring meetings.
 * @property all - Update all of the recurring meetings.
 * @property future - Update this and all future meetings.
 * @property this - Only update this meeting instance.
 */
export type MeetingAction = 'all' | 'future' | 'this';

/**
 * @typedef {Object} Meeting
 * @extends Resource
 * @property creator - The person who created this meeting.
 * @property venue - Link to the meeting venue (e.g. Zoom or Jitsi).
 * @property time - Time of the meeting (e.g. Tuesday 3:00 - 3:30 PM).
 * @property creator - The person who logged the meeting (typically the tutor).
 * @property description - Notes about the meeting (e.g. what they worked on).
 * @property [parentId] - The recurring parent meeting ID (if any).
 */
export interface MeetingInterface extends ResourceInterface {
  id: number;
  tags: MeetingTag[];
  org: string;
  subjects: Subject[];
  people: User[];
  creator: User;
  description: string;
  venue: string;
  time: Timeslot;
  parentId?: number;
}

export type MeetingJSON = Omit<
  MeetingInterface,
  keyof Resource | 'time' | 'creator' | 'people'
> &
  ResourceJSON & { time: TimeslotJSON; creator: UserJSON; people: UserJSON[] };

export function isMeetingJSON(json: unknown): json is MeetingJSON {
  if (!isResourceJSON(json)) return false;
  if (!isJSON(json)) return false;
  if (typeof json.id !== 'number') return false;
  if (!isArray(json.tags, isMeetingTag)) return false;
  if (typeof json.org !== 'string') return false;
  if (!isArray(json.subjects, isSubject)) return false;
  if (!isArray(json.people, isUserJSON)) return false;
  if (!isUserJSON(json.creator)) return false;
  if (typeof json.description !== 'string') return false;
  if (!isTimeslotJSON(json.time)) return false;
  if (json.parentId && typeof json.parentId !== 'number') return false;
  return true;
}

export interface DBMeeting {
  id: number;
  org: string;
  creator: string;
  description: string;
  tags: DBMeetingTag[];
  time: DBTimeslot;
  venue: string;
  created: DBDate;
  updated: DBDate;
}
export interface DBViewMeeting extends DBMeeting {
  subjects: Subject[];
  people: DBPerson[] | null;
  people_ids: string[];
}
export interface DBHoursCumulative extends DBMeeting {
  subjects: Subject[];
  people: DBPerson[] | null;
  instance_time: string;
  user: string;
  hours: number;
  total: number;
}
export interface DBRelationMeetingSubject {
  meeting: number;
  subject: number;
}
export interface DBRelationPerson {
  meeting: number;
  user: string;
  roles: Role[];
}

export interface MeetingSegment {
  id: number;
  description: string;
  subjects: Subject[];
  start: Date;
  end: Date;
}

export class Meeting extends Resource implements MeetingInterface {
  public id = 0;

  public tags: MeetingTag[] = [];

  public org = 'default';

  public subjects: Subject[] = [];

  public people: User[] = [];

  public creator: User = new User();

  public description = '';

  public venue = `https://meet.jit.si/TB-${nanoid(10)}`;

  public time = new Timeslot();

  public parentId?: number;

  public constructor(meeting: Partial<MeetingInterface> = {}) {
    super(meeting);
    construct<MeetingInterface, ResourceInterface>(
      this,
      meeting,
      new Resource()
    );
  }

  public get clone(): Meeting {
    return new Meeting(clone(this));
  }

  public get volunteer(): User | undefined {
    return this.people.find((p) => p.roles.includes('tutor'));
  }

  public get student(): User | undefined {
    return this.people.find((p) => p.roles.includes('tutee'));
  }

  public toString(): string {
    return `Meeting on ${this.time.toString()}`;
  }

  public toDB(): DBMeeting {
    return {
      id: this.id,
      org: this.org,
      creator: this.creator.id,
      venue: this.venue,
      time: this.time.toDB(),
      description: this.description,
      tags: [...this.tags, ...notTags(this.tags, MEETING_TAGS)],
      created: this.created.toISOString(),
      updated: this.updated.toISOString(),
    };
  }

  public static fromDB(record: DBMeeting | DBViewMeeting): Meeting {
    const creator =
      'people' in record
        ? (record.people || []).find((p) => p.id === record.creator)
        : undefined;
    const people =
      'people' in record
        ? (record.people || []).map((p) => User.fromDB(p))
        : [];
    return new Meeting({
      people,
      id: record.id,
      org: record.org,
      subjects: 'subjects' in record ? record.subjects || [] : [],
      creator: creator
        ? User.fromDB(creator)
        : new User({ id: record.creator }),
      venue: record.venue,
      time: Timeslot.fromDB(record.time),
      description: record.description,
      tags: record.tags.filter(isMeetingTag),
      created: new Date(record.created),
      updated: new Date(record.updated),
    });
  }

  public toJSON(): MeetingJSON {
    return definedVals({
      ...this,
      ...super.toJSON(),
      time: this.time.toJSON(),
      creator: this.creator.toJSON(),
      people: this.people.map((p) => p.toJSON()),
    });
  }

  public static fromJSON(json: MeetingJSON): Meeting {
    return new Meeting({
      ...json,
      ...Resource.fromJSON(json),
      time: Timeslot.fromJSON(json.time),
      creator: User.fromJSON(json.creator),
      people: json.people.map((p) => User.fromJSON(p)),
    });
  }

  public toCSV(): Record<string, string> {
    return {
      'Meeting ID': this.id.toString(),
      'Meeting Subjects': join(this.subjects.map((s) => s.name)),
      'Meeting Description': this.description,
      'Meeting Tags': join(this.tags),
      'Meeting Created': this.created.toString(),
      'Meeting Last Updated': this.updated.toString(),
      'Volunteer ID': this.volunteer?.id || '',
      'Volunteer Name': this.volunteer?.name || '',
      'Volunteer Photo URL': this.volunteer?.photo || '',
      'Student ID': this.student?.id || '',
      'Student Name': this.student?.name || '',
      'Student Photo URL': this.student?.photo || '',
      'Meeting Start': this.time.from.toString(),
      'Meeting End': this.time.to.toString(),
    };
  }

  public toSegment(): MeetingSegment {
    return {
      id: this.id,
      description: this.description,
      subjects: this.subjects,
      start: this.time.from,
      end: this.time.to,
    };
  }
}
