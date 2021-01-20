import * as admin from 'firebase-admin';
import { ObjectWithObjectID } from '@algolia/client-search';

import {
  Resource,
  ResourceFirestore,
  ResourceInterface,
  ResourceJSON,
  ResourceSearchHit,
  isResourceJSON,
} from 'lib/model/resource';
import { isArray, isJSON } from 'lib/model/json';
import clone from 'lib/utils/clone';
import construct from 'lib/model/construct';
import definedVals from 'lib/model/defined-vals';

type DocumentSnapshot = admin.firestore.DocumentSnapshot;
type DocumentReference = admin.firestore.DocumentReference;

/**
 * Represents a user verification to provide social proof. Supported types are:
 * - A background check or UK DBS on file
 * - A verified academic email address (e.g. `ac.uk` or `stanford.edu`)
 * - A verified social media account (i.e. LinkedIn, Twitter, FB, Insta)
 * - A personal website (mostly just an easy way to link to a resume site)
 *
 * These "socials" are then shown directly beneath the user's name in the
 * `UserDialog` making it easy for students (and/or their parents) to view and
 * feel assured about a potential tutor's qualifications.
 */
export type SocialTypeAlias =
  | 'website'
  | 'linkedin'
  | 'twitter'
  | 'facebook'
  | 'instagram'
  | 'github'
  | 'indiehackers';

export interface SocialInterface {
  type: SocialTypeAlias;
  url: string;
}

export function isSocial(json: unknown): json is SocialInterface {
  const socialTypes = [
    'website',
    'linkedin',
    'twitter',
    'facebook',
    'instagram',
    'github',
    'indiehackers',
  ];

  if (!isJSON(json)) return false;
  if (typeof json.type !== 'string') return false;
  if (!socialTypes.includes(json.type)) return false;
  if (typeof json.url !== 'string') return false;
  return true;
}

/**
 * An account object that both orgs and users extend.
 * @typedef {Object} AccountInterface
 * @property id - The account's Firebase Authentication identifier.
 * @property name - Display name (e.g. "Nicholas Chiang").
 * @property photo - Profile photo URL (i.e. the account's avatar).
 * @property email - Email address (e.g. "nicholas@tutorbook.org").
 * @property bio - A description of the org or user.
 * @property background - An optional background or banner image shown on the
 * org landing page and user display page.
 * @property socials - An array of the account's social media links.
 */
export interface AccountInterface extends ResourceInterface {
  id: string;
  name: string;
  photo: string;
  email: string;
  phone: string;
  bio: string;
  background: string;
  socials: SocialInterface[];
  ref?: DocumentReference;
}

export type AccountJSON = Omit<AccountInterface, keyof Resource> & ResourceJSON;
export type AccountFirestore = Omit<AccountInterface, keyof Resource> &
  ResourceFirestore;
export type AccountSearchHit = ObjectWithObjectID &
  Omit<AccountInterface, keyof Resource | 'id'> &
  ResourceSearchHit;

export function isAccountJSON(json: unknown): json is AccountJSON {
  const stringFields = [
    'id',
    'name',
    'photo',
    'email',
    'phone',
    'bio',
    'background',
  ];

  if (!isResourceJSON(json)) return false;
  if (!isJSON(json)) return false;
  if (stringFields.some((key) => typeof json[key] !== 'string')) return false;
  if (!isArray(json.socials, isSocial)) return false;
  return true;
}

export class Account extends Resource implements AccountInterface {
  public id = '';

  public name = '';

  public photo = '';

  public email = '';

  public phone = '';

  public bio = '';

  public background = '';

  public socials: SocialInterface[] = [];

  public ref?: DocumentReference;

  public constructor(account: Partial<AccountInterface> = {}) {
    super(account);
    construct<AccountInterface, ResourceInterface>(
      this,
      account,
      new Resource()
    );
    this.socials = this.socials.filter((s: SocialInterface) => !!s.url);
    void this.validatePhone();
  }

  public get clone(): Account {
    return new Account(clone(this));
  }

  public async validatePhone(): Promise<void> {
    const { default: phone } = await import('phone');
    this.phone = phone(this.phone)[0] || '';
  }

  public toJSON(): AccountJSON {
    return definedVals({ ...this, ...super.toJSON(), ref: undefined });
  }

  public static fromJSON(json: AccountJSON): Account {
    return new Account({ ...json, ...Resource.fromJSON(json) });
  }

  public toFirestore(): AccountFirestore {
    return definedVals({ ...this, ...super.toFirestore(), ref: undefined });
  }

  public static fromFirestore(data: AccountFirestore): Account {
    return new Account({ ...data, ...Resource.fromFirestore(data) });
  }

  public static fromFirestoreDoc(snapshot: DocumentSnapshot): Account {
    if (!snapshot.exists) return new Account();
    const overrides = definedVals({
      created: snapshot.createTime?.toDate(),
      updated: snapshot.updateTime?.toDate(),
      ref: snapshot.ref,
      id: snapshot.id,
    });
    const account = Account.fromFirestore(snapshot.data() as AccountFirestore);
    return new Account({ ...account, ...overrides });
  }

  public toSearchHit(): AccountSearchHit {
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
    ...rest
  }: AccountSearchHit): Account {
    return new Account({
      ...rest,
      ...Resource.fromSearchHit(rest),
      id: objectID,
    });
  }

  public toString(): string {
    return `${this.name}${this.id ? ` (${this.id})` : ''}`;
  }

  public toSegment(): Record<string, string> {
    const website = this.socials.filter((s) => s.type === 'website')[0];
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      phone: this.phone,
      avatar: this.photo,
      description: this.bio,
      website: website?.url,
    };
  }
}
