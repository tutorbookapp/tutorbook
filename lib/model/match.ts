import { DBPerson, Role, User, UserJSON, isUserJSON } from 'lib/model/user';
import {
  Resource,
  ResourceInterface,
  ResourceJSON,
  isResourceJSON,
} from 'lib/model/resource';
import { isArray, isJSON, isStringArray } from 'lib/model/json';
import { join, notTags } from 'lib/utils';
import { Aspect } from 'lib/model/aspect';
import { DBDate } from 'lib/model/timeslot';
import clone from 'lib/utils/clone';
import construct from 'lib/model/construct';
import definedVals from 'lib/model/defined-vals';

export type MatchTag = 'meeting'; // Match has at least one meeting.

export type DBMatchTag = MatchTag | 'not-meeting';

export const MATCH_TAGS: MatchTag[] = ['meeting'];

export function isMatchTag(tag: unknown): tag is MatchTag {
  return tag === 'meeting';
}

/**
 * Represents a tutoring lesson or mentoring appointment.
 * @typedef {Object} MatchInterface
 * @property org - The ID of the organization that owns this request or match.
 * @property subjects - The subjects that this match is about (e.g. AP CS).
 * @property people - The people involved in this match (i.e. pupil and tutor).
 * @property creator - The person who created this match (e.g. pupil or admin).
 * @property description - A more detailed description of this match.
 */
export interface MatchInterface extends ResourceInterface {
  id: number;
  tags: MatchTag[];
  org: string;
  subjects: string[];
  people: User[];
  creator: User;
  description: string;
}

export type MatchJSON = Omit<
  MatchInterface,
  keyof Resource | 'creator' | 'people'
> &
  ResourceJSON & { creator: UserJSON; people: UserJSON[] };

export function isMatchJSON(json: unknown): json is MatchJSON {
  if (!isResourceJSON(json)) return false;
  if (!isJSON(json)) return false;
  if (typeof json.id !== 'number') return false;
  if (!isArray(json.tags, isMatchTag)) return false;
  if (typeof json.org !== 'string') return false;
  if (!isStringArray(json.subjects)) return false;
  if (!isArray(json.people, isUserJSON)) return false;
  if (!isUserJSON(json.creator)) return false;
  if (typeof json.description !== 'string') return false;
  return true;
}

export interface DBMatch {
  id: number;
  org: string;
  creator: string;
  subjects: string[];
  description: string;
  tags: DBMatchTag[];
  created: DBDate;
  updated: DBDate;
}
export interface DBViewMatch extends DBMatch {
  people: DBPerson[] | null;
  people_ids: string[];
}
export interface DBRelationMatchPerson {
  user: string;
  match: number;
  roles: Role[];
}

export interface MatchSegment {
  id: number;
  description: string;
  subjects: string[];
}

export class Match extends Resource implements MatchInterface {
  public id = 0;

  public tags: MatchTag[] = [];

  public org = 'default';

  public subjects: string[] = [];

  public people: User[] = [];

  public creator: User = new User();

  public description = '';

  public constructor(match: Partial<MatchInterface> = {}) {
    super(match);
    construct<MatchInterface, ResourceInterface>(this, match, new Resource());
  }

  public get clone(): Match {
    return new Match(clone(this));
  }

  public get aspect(): Aspect {
    const isTutor = (a: User) => a.roles.indexOf('tutor') >= 0;
    const isTutee = (a: User) => a.roles.indexOf('tutee') >= 0;
    if (this.people.some((a) => isTutor(a) || isTutee(a))) return 'tutoring';
    return 'mentoring';
  }

  public get volunteer(): User | undefined {
    return this.people.find(
      (p) => p.roles.includes('tutor') || p.roles.includes('mentor')
    );
  }

  public get student(): User | undefined {
    return this.people.find(
      (p) => p.roles.includes('tutee') || p.roles.includes('mentee')
    );
  }

  public toString(): string {
    return `Match for ${join(this.subjects) || 'No Subjects'}`;
  }

  public toDB(): DBMatch {
    return {
      id: this.id,
      org: this.org,
      creator: this.creator.id,
      subjects: this.subjects,
      description: this.description,
      tags: [...this.tags, ...notTags(this.tags, MATCH_TAGS)],
      created: this.created.toISOString(),
      updated: this.updated.toISOString(),
    };
  }

  public static fromDB(record: DBMatch | DBViewMatch): Match {
    const creator =
      'people' in record
        ? (record.people || []).find((p) => p.id === record.creator)
        : undefined;
    const people =
      'people' in record
        ? (record.people || []).map((p) => User.fromDB(p))
        : [];
    return new Match({
      people,
      id: record.id,
      org: record.org,
      creator: creator
        ? User.fromDB(creator)
        : new User({ id: record.creator }),
      subjects: record.subjects,
      description: record.description,
      tags: record.tags.filter(isMatchTag),
      created: new Date(record.created),
      updated: new Date(record.updated),
    });
  }

  public toJSON(): MatchJSON {
    return definedVals({
      ...this,
      ...super.toJSON(),
      creator: this.creator.toJSON(),
      people: this.people.map((p) => p.toJSON()),
    });
  }

  public static fromJSON(json: MatchJSON): Match {
    return new Match({
      ...json,
      ...Resource.fromJSON(json),
      creator: User.fromJSON(json.creator),
      people: json.people.map((p) => User.fromJSON(p)),
    });
  }

  public toCSV(): Record<string, string> {
    return {
      'Match ID': this.id.toString(),
      'Match Subjects': join(this.subjects),
      'Match Description': this.description,
      'Match Tags': join(this.tags),
      'Match Created': this.created.toString(),
      'Match Last Updated': this.updated.toString(),
      'Volunteer ID': this.volunteer?.id || '',
      'Volunteer Name': this.volunteer?.name || '',
      'Volunteer Photo URL': this.volunteer?.photo || '',
      'Student ID': this.student?.id || '',
      'Student Name': this.student?.name || '',
      'Student Photo URL': this.student?.photo || '',
    };
  }

  public toSegment(): MatchSegment {
    const { description, subjects, id } = this;
    return { description, subjects, id };
  }
}
