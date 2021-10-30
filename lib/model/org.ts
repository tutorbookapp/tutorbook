import {
  Account,
  AccountInterface,
  AccountJSON,
  isAccountJSON,
} from 'lib/model/account';
import { DBSocial, DBUser, UserInterface } from 'lib/model/user';
import { Subject, isSubject } from 'lib/model/subject';
import { isArray, isJSON, isStringArray } from 'lib/model/json';
import { DBDate } from 'lib/model/timeslot';
import clone from 'lib/utils/clone';
import construct from 'lib/model/construct';
import definedVals from 'lib/model/defined-vals';

type Config<T> = { [locale: string]: T };

type SignupConfig = Config<{ header: string; body: string; bio: string }>;
type HomeConfig = Config<{ header: string; body: string }>;
type BookingConfig = Config<{ message: string }>;

export function isSignupConfig(config: unknown): config is SignupConfig {
  if (!isJSON(config)) return false;
  return Object.values(config).every((localeConfig) => {
    if (!isJSON(localeConfig)) return false;
    if (!isJSON(localeConfig)) return false;
    if (typeof localeConfig.header !== 'string') return false;
    if (typeof localeConfig.body !== 'string') return false;
    if (typeof localeConfig.bio !== 'string') return false;
    return true;
  });
}

export function isHomeConfig(config: unknown): config is SignupConfig {
  if (!isJSON(config)) return false;
  return Object.values(config).every((localeConfig) => {
    if (!isJSON(localeConfig)) return false;
    if (typeof localeConfig.header !== 'string') return false;
    if (typeof localeConfig.body !== 'string') return false;
    return true;
  });
}

export function isBookingConfig(config: unknown): config is BookingConfig {
  if (!isJSON(config)) return false;
  return Object.values(config).every((localeConfig) => {
    if (!isJSON(localeConfig)) return false;
    if (typeof localeConfig.message !== 'string') return false;
    return true;
  });
}

/**
 * An `Org` object represents a non-profit organization that is using Tutorbook
 * to manage their virtual tutoring programs.
 * @typedef {Object} Org
 * @property members - An array of user UIDs that are members of this org.
 * @property domains - Array of valid email domains that can access this org's
 * data (e.g. `pausd.us` and `pausd.org`).
 * @property profiles - Array of required profile fields (e.g. `phone`).
 * @property signup - Configuration for the org's unique custom sign-up page.
 * @property home - Configuration for the org's unique custom landing homepage.
 * @property booking - Configuration for the org's user booking pages.
 * @property [matchLink] - Temporary fix for QuaranTunes' need to link to a
 * Picktime page for scheduling instead of creating matches within TB.
 * @see {@link https://github.com/tutorbookapp/tutorbook/issues/138}
 */
export interface OrgInterface extends AccountInterface {
  members: string[];
  domains: string[];
  profiles: (keyof UserInterface | 'subjects')[];
  subjects?: Subject[];
  signup: SignupConfig;
  home: HomeConfig;
  booking: BookingConfig;
}

export interface DBOrg {
  id: string;
  name: string;
  photo: string | null;
  email: string | null;
  phone: string | null;
  bio: string;
  background: string | null;
  venue: string | null;
  socials: DBSocial[];
  domains: string[] | null;
  profiles: (keyof DBUser)[];
  signup: object;
  home: object;
  booking: object;
  created: DBDate;
  updated: DBDate;
}
export interface DBViewOrg extends DBOrg {
  subjects: Subject[] | null;
  members: string[];
}
export interface DBRelationOrgSubject {
  org: string;
  subject: number;
}
export interface DBRelationMember {
  org: string;
  user: string;
}

export type OrgJSON = Omit<OrgInterface, keyof Account> & AccountJSON;

// TODO: Check that the `profiles` key only contains keys of the `User` object.
export function isOrgJSON(json: unknown): json is OrgJSON {
  if (!isAccountJSON(json)) return false;
  if (!isJSON(json)) return false;
  if (!isStringArray(json.members)) return false;
  if (!isStringArray(json.domains)) return false;
  if (!isStringArray(json.profiles)) return false;
  if (json.subjects && !isArray(json.subjects, isSubject)) return false;
  if (!isSignupConfig(json.signup)) return false;
  if (!isHomeConfig(json.home)) return false;
  if (!isBookingConfig(json.booking)) return false;
  return true;
}

export class Org extends Account implements OrgInterface {
  public members: string[] = [];

  public domains: string[] = [];

  public profiles: (keyof UserInterface | 'subjects')[] = [
    'name',
    'email',
    'bio',
    'subjects',
    'langs',
    'availability',
  ];

  public subjects?: Subject[];

  // TODO: Don't only include org data that the user is an admin of. Instead,
  // keep an app-wide org context that includes the org configurations for all
  // of the orgs a user is a part of. We'll need that data to customize the user
  // specific pages (e.g. their universal profile page, matches schedule, etc).
  // TODO: Include these org specific bio placeholders in the user profile page.
  public signup: SignupConfig = {
    en: {
      header: 'Support students throughout COVID',
      body:
        'Help us support the millions of K-12 students who no longer have ' +
        "individualized instruction due to COVID-19. We're making sure " +
        'that no one loses out on education in these difficult times by ' +
        'connecting students with free, volunteer tutors like you.',
      bio:
        "Ex: I'm currently an electrical engineering Ph.D. student at " +
        'Stanford University who has been volunteering with AmeriCorps ' +
        "(tutoring local high schoolers) for over five years now. I'm " +
        'passionate about teaching and would love to help you in any way ' +
        'that I can!',
    },
  };

  public home: HomeConfig = {
    en: {
      header: 'How it works',
      body:
        'First, new volunteers register using the sign-up form linked to the ' +
        'right. Organization admins then vet those volunteers (to ensure ' +
        'they are who they say they are) before adding them to the search ' +
        'view for students to find. Finally, students and parents use the ' +
        'search view (linked to the right) to find and request those ' +
        'volunteers. Recurring meetings (e.g. on Zoom or Google Meet) are ' +
        'then set up via email.',
    },
  };

  public booking: BookingConfig = {
    en: {
      message:
        'Ex: {{person}} could really use your help with a {{subject}} project.',
    },
  };

  public constructor(org: Partial<OrgInterface> = {}) {
    super(org);
    construct<OrgInterface, AccountInterface>(this, org, new Account());
  }

  public get clone(): Org {
    return new Org(clone(this));
  }

  public toDB(): DBOrg {
    return {
      id: this.id,
      name: this.name,
      photo: this.photo || null,
      email: this.email || null,
      phone: this.phone || null,
      bio: this.bio,
      background: this.background || null,
      venue: this.venue || null,
      socials: this.socials,
      domains: this.domains.length ? this.domains : null,
      profiles: this.profiles as (keyof DBUser)[],
      signup: this.signup,
      home: this.home,
      booking: this.booking,
      created: this.created.toISOString(),
      updated: this.updated.toISOString(),
    };
  }

  public static fromDB(record: DBOrg | DBViewOrg): Org {
    return new Org({
      id: record.id,
      name: record.name,
      photo: record.photo || '',
      email: record.email || '',
      phone: record.phone || '',
      bio: record.bio,
      background: record.background || '',
      venue: record.venue || '',
      socials: record.socials,
      domains: record.domains?.length ? record.domains : [],
      profiles: record.profiles as (keyof UserInterface | 'subjects')[],
      signup: record.signup as SignupConfig,
      home: record.home as HomeConfig,
      booking: record.booking as BookingConfig,
      created: new Date(record.created),
      updated: new Date(record.updated),
      subjects: 'subjects' in record ? record.subjects?.map((s) => ({ name: s.name, id: s.id })) || undefined : undefined,
      members: 'members' in record ? record.members : [],
    });
  }

  public toJSON(): OrgJSON {
    return definedVals({ ...this, ...super.toJSON() });
  }

  public static fromJSON(json: OrgJSON): Org {
    return new Org({ ...json, ...Account.fromJSON(json) });
  }
}
