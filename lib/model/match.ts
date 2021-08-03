import { Person, Role, isPerson } from 'lib/model/person';
import {
  Resource,
  ResourceInterface,
  ResourceJSON,
  isResourceJSON,
} from 'lib/model/resource';
import { isArray, isJSON } from 'lib/model/json';
import { join, notTags } from 'lib/utils';
import { Aspect } from 'lib/model/aspect';
import { DBDate } from 'lib/model/timeslot';
import { DBUser } from 'lib/model/user';
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
 * @property message - A more detailed description of this match or request.
 */
export interface MatchInterface extends ResourceInterface {
  org: string;
  subjects: string[];
  people: Person[];
  creator: Person;
  message: string;
  tags: MatchTag[];
  id: string;
}

export interface DBMatch {
  id: number;
  org: string;
  creator: string;
  subjects: string[];
  message: string;
  tags: DBMatchTag[];
  created: DBDate;
  updated: DBDate;
}
export interface DBViewMatch extends DBMatch {
  people: (DBUser & { roles: Role[] })[] | null;
  people_ids: string[];
}
export interface DBRelationMatchPerson {
  user: string;
  match: number;
  roles: ('tutor' | 'tutee' | 'mentor' | 'mentee' | 'parent')[];
}

export type MatchJSON = Omit<MatchInterface, keyof Resource> & ResourceJSON;

export interface MatchSegment {
  id: string;
  message: string;
  subjects: string[];
}

export function isMatchJSON(json: unknown): json is MatchJSON {
  if (!isResourceJSON(json)) return false;
  if (!isJSON(json)) return false;
  if (typeof json.org !== 'string') return false;
  if (!(json.subjects instanceof Array)) return false;
  if (json.subjects.some((s) => typeof s !== 'string')) return false;
  if (!(json.people instanceof Array)) return false;
  if (json.people.some((p) => !isPerson(p))) return false;
  if (!isPerson(json.creator)) return false;
  if (typeof json.message !== 'string') return false;
  if (!isArray(json.tags, isMatchTag)) return false;
  if (typeof json.id !== 'string') return false;
  return true;
}

export class Match extends Resource implements MatchInterface {
  public org = 'default';

  public subjects: string[] = [];

  public people: Person[] = [];

  public creator: Person = {
    id: '',
    name: '',
    photo: '',
    roles: [],
  };

  public message = '';

  public tags: MatchTag[] = [];

  public id = '';

  public constructor(match: Partial<MatchInterface> = {}) {
    super(match);
    construct<MatchInterface, ResourceInterface>(this, match, new Resource());
  }

  public get clone(): Match {
    return new Match(clone(this));
  }

  public get aspect(): Aspect {
    const isTutor = (a: Person) => a.roles.indexOf('tutor') >= 0;
    const isTutee = (a: Person) => a.roles.indexOf('tutee') >= 0;
    if (this.people.some((a) => isTutor(a) || isTutee(a))) return 'tutoring';
    return 'mentoring';
  }

  public get volunteer(): Person | undefined {
    return this.people.find(
      (p) => p.roles.includes('tutor') || p.roles.includes('mentor')
    );
  }

  public get student(): Person | undefined {
    return this.people.find(
      (p) => p.roles.includes('tutee') || p.roles.includes('mentee')
    );
  }

  public toString(): string {
    return `Match for ${join(this.subjects) || 'No Subjects'}`;
  }

  public toDB(): DBMatch {
    return {
      id: Number(this.id),
      org: this.org,
      creator: this.creator.id,
      subjects: this.subjects,
      message: this.message,
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
        ? (record.people || []).map((p) => ({
            id: p.id,
            name: p.name,
            photo: p.photo || '',
            roles: p.roles,
          }))
        : [];
    return new Match({
      people,
      id: record.id.toString(),
      org: record.org,
      creator: {
        id: record.creator,
        name: creator?.name || '',
        photo: creator?.photo || '',
        roles: creator?.roles || [],
      },
      subjects: record.subjects,
      message: record.message,
      tags: record.tags.filter(isMatchTag),
      created: new Date(record.created),
      updated: new Date(record.updated),
    });
  }

  public toJSON(): MatchJSON {
    return definedVals({ ...this, ...super.toJSON() });
  }

  public static fromJSON(json: MatchJSON): Match {
    return new Match({ ...json, ...Resource.fromJSON(json) });
  }

  public toCSV(): Record<string, string> {
    return {
      'Match ID': this.id,
      'Match Subjects': join(this.subjects),
      'Match Message': this.message,
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
    return { id: this.id, message: this.message, subjects: this.subjects };
  }
}
