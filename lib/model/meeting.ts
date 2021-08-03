import {
  DBDate,
  DBTimeslot,
  Timeslot,
  TimeslotJSON,
  isTimeslotJSON,
} from 'lib/model/timeslot';
import { Match, MatchJSON, MatchSegment, isMatchJSON } from 'lib/model/match';
import { Person, Role, isPerson } from 'lib/model/person';
import {
  Resource,
  ResourceInterface,
  ResourceJSON,
  isResourceJSON,
} from 'lib/model/resource';
import { Venue, VenueJSON, isVenueJSON } from 'lib/model/venue';
import { isArray, isJSON } from 'lib/model/json';
import { join, notTags } from 'lib/utils';
import { DBUser } from 'lib/model/user';
import clone from 'lib/utils/clone';
import construct from 'lib/model/construct';
import definedVals from 'lib/model/defined-vals';

export type MeetingTag = 'recurring'; // Meeting is recurring (has rrule).

export type MeetingHitTag = MeetingTag | 'not-recurring';

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
 * A meeting's status starts as `pending`, becomes `logged` once a tutor or
 * student confirms they've attended the meeting, and finally becomes `approved`
 * once an org admin (or an automation they've setup) approves the logged hours.
 * @typedef MeetingStatus
 * @todo Implement the approval process so that the `approved` status is used.
 */
export type MeetingStatus = 'created' | 'pending' | 'logged' | 'approved';

/**
 * A meeting is a past appointment logged for a match (e.g. John and Jane met
 * last week for 30 mins on Tuesday 3:00 - 3:30 PM).
 * @typedef {Object} Meeting
 * @extends Resource
 * @property status - This meeting's status (i.e. pending, logged, or approved).
 * @property creator - The person who created this meeting.
 * @property match - This meeting's match.
 * @property venue - Link to the meeting venue (e.g. Zoom or Jitsi).
 * @property time - Time of the meeting (e.g. Tuesday 3:00 - 3:30 PM).
 * @property creator - The person who logged the meeting (typically the tutor).
 * @property description - Notes about the meeting (e.g. what they worked on).
 * @property [parentId] - The recurring parent meeting ID (if any).
 */
export interface MeetingInterface extends ResourceInterface {
  status: MeetingStatus;
  creator: Person;
  match: Match;
  venue: Venue;
  time: Timeslot;
  description: string;
  tags: MeetingTag[];
  parentId?: string;
  id: string;
}

export interface DBMeeting {
  id: number;
  org: string;
  creator: string;
  subjects: string[];
  status: 'created' | 'pending' | 'logged' | 'approved';
  match: number;
  venue: string;
  time: DBTimeslot;
  description: string;
  tags: 'recurring'[];
  created: DBDate;
  updated: DBDate;
}
export interface DBViewMeeting extends DBMeeting {
  people: (DBUser & { roles: Role[] })[] | null;
  people_ids: string[];
}
export interface DBRelationMeetingPerson {
  user: string;
  meeting: number;
  roles: ('tutor' | 'tutee' | 'mentor' | 'mentee' | 'parent')[];
}

export type MeetingJSON = Omit<
  MeetingInterface,
  keyof Resource | 'time' | 'venue' | 'match'
> &
  ResourceJSON & { time: TimeslotJSON; venue: VenueJSON; match: MatchJSON };

export interface MeetingSegment {
  id: string;
  description: string;
  start: Date;
  end: Date;
  match: MatchSegment;
}

export function isMeetingJSON(json: unknown): json is MeetingJSON {
  if (!isResourceJSON(json)) return false;
  if (!isJSON(json)) return false;
  if (typeof json.status !== 'string') return false;
  if (!['created', 'pending', 'logged', 'approved'].includes(json.status))
    return false;
  if (!isPerson(json.creator)) return false;
  if (!isMatchJSON(json.match)) return false;
  if (!isVenueJSON(json.venue)) return false;
  if (!isTimeslotJSON(json.time)) return false;
  if (typeof json.description !== 'string') return false;
  if (!isArray(json.tags, isMeetingTag)) return false;
  if (json.parentId && typeof json.parentId !== 'string') return false;
  if (typeof json.id !== 'string') return false;
  return true;
}

export class Meeting extends Resource implements MeetingInterface {
  public status: MeetingStatus = 'pending';

  public creator: Person = {
    id: '',
    name: '',
    photo: '',
    roles: [],
  };

  public match = new Match();

  public venue = new Venue();

  public time = new Timeslot();

  public description = '';

  public tags: MeetingTag[] = [];

  public parentId?: string;

  public id = '';

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

  public toString(): string {
    return `Meeting on ${this.time.toString()}`;
  }

  public toDB(): DBMeeting {
    return {
      id: Number(this.id),
      org: this.match.org,
      creator: this.creator.id,
      subjects: this.match.subjects,
      status: this.status,
      match: Number(this.match.id),
      venue: this.venue.url,
      time: this.time.toDB(),
      description: this.description,
      tags: this.tags,
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
        ? (record.people || []).map((p) => ({
            id: p.id,
            name: p.name,
            photo: p.photo || '',
            roles: p.roles,
          }))
        : [];
    return new Meeting({
      id: record.id.toString(),
      creator: {
        id: record.creator,
        name: creator?.name || '',
        photo: creator?.photo || '',
        roles: creator?.roles || [],
      },
      status: record.status,
      venue: new Venue({ url: record.venue }),
      time: Timeslot.fromDB(record.time),
      description: record.description,
      tags: record.tags,
      created: new Date(record.created),
      updated: new Date(record.updated),
      match: new Match({
        people,
        id: record.match.toString(),
        org: record.org,
        subjects: record.subjects,
        creator: {
          id: record.creator,
          name: creator?.name || '',
          photo: creator?.photo || '',
          roles: creator?.roles || [],
        },
      }),
    });
  }

  public toJSON(): MeetingJSON {
    const { time, venue, match, ...rest } = this;
    return definedVals({
      ...rest,
      ...super.toJSON(),
      time: time.toJSON(),
      venue: venue.toJSON(),
      match: match.toJSON(),
    });
  }

  public static fromJSON({
    time,
    venue,
    match,
    ...rest
  }: MeetingJSON): Meeting {
    return new Meeting({
      ...rest,
      ...Resource.fromJSON(rest),
      time: Timeslot.fromJSON(time),
      venue: Venue.fromJSON(venue),
      match: Match.fromJSON(match),
    });
  }

  public toCSV(): Record<string, string> {
    return {
      'Meeting ID': this.id,
      'Meeting Description': this.description,
      'Meeting Start': this.time.from.toString(),
      'Meeting End': this.time.to.toString(),
      'Meeting Tags': join(this.tags),
      'Meeting Created': this.created.toString(),
      'Meeting Last Updated': this.updated.toString(),
      ...this.match.toCSV(),
    };
  }

  public toSegment(): MeetingSegment {
    return {
      id: this.id,
      description: this.description,
      start: this.time.from,
      end: this.time.to,
      match: this.match.toSegment(),
    };
  }
}
