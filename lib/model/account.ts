import * as admin from 'firebase-admin';

import construct from 'lib/model/construct';
import firestoreVals from 'lib/model/firestore-vals';
import { isJSON } from 'lib/model/json';

type DocumentData = admin.firestore.DocumentData;
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
 * An `Account` object is the base object that is extended by the `Org` and
 * `User` objects. That way, we can have one `AccountProvider` for both orgs and
 * users.
 */
export interface AccountInterface {
  id: string;
  name: string;
  photo: string;
  email: string;
  phone: string;
  bio: string;
  socials: SocialInterface[];
  ref?: DocumentReference;
}

export type AccountJSON = AccountInterface;

export function isAccountJSON(json: unknown): json is AccountJSON {
  const stringFields = ['id', 'name', 'photo', 'email', 'phone', 'bio'];

  if (!isJSON(json)) return false;
  if (stringFields.some((key) => typeof json[key] !== 'string')) return false;
  if (!(json.socials instanceof Array)) return false;
  if (json.socials.some((social) => !isSocial(social))) return false;
  return true;
}

// TODO: Make this an abstract class but still prevent the `phone` property from
// being overriden by child constructors (i.e. the child constructor doesn't
// perform the same phone validation as this one does).
export class Account implements AccountInterface {
  public id = '';

  public name = '';

  public photo = '';

  public email = '';

  public phone = '';

  public bio = '';

  public socials: SocialInterface[] = [];

  public ref?: DocumentReference;

  public constructor(account: Partial<AccountInterface> = {}) {
    construct<AccountInterface>(this, account);
    this.socials = this.socials.filter((s: SocialInterface) => !!s.url);
    void this.validatePhone();
  }

  public async validatePhone(): Promise<void> {
    const { default: phone } = await import('phone');
    this.phone = phone(this.phone)[0] || '';
  }

  public toFirestore(): DocumentData {
    return firestoreVals({ ...this, ref: undefined });
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
