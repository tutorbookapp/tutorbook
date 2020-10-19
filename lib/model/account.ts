import * as admin from 'firebase-admin';

import construct from 'lib/model/construct';
import firestoreVals from 'lib/model/firestore-vals';
import { isJSON } from 'lib/model/json';

type DocumentData = admin.firestore.DocumentData;
type DocumentReference = admin.firestore.DocumentReference;

/**
 * Duplicate definition from the `lib/react-intercom` package. These are
 * all the valid datatypes for custom Intercom user attributes.
 * @see {@link https://www.intercom.com/help/en/articles/179-send-custom-user-attributes-to-intercom}
 */
type IntercomCustomAttribute = string | boolean | number | Date;

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

  /**
   * Converts this `Account` object into a `Record<string, any>` that Intercom
   * can understand.
   * @see {@link https://developers.intercom.com/installing-intercom/docs/javascript-api-attributes-objects#section-data-attributes}
   */
  public toIntercom(): Record<string, IntercomCustomAttribute> {
    const { id, photo, ref, ...rest } = this;
    const isFilled: (val: any) => boolean = (val: any) => {
      switch (typeof val) {
        case 'string':
          return val !== '';
        case 'boolean':
          return true;
        case 'number':
          return true;
        case 'undefined':
          return false;
        case 'object':
          return Object.values(val).filter(isFilled).length > 0;
        default:
          return !!val;
      }
    };
    const isValid: (val: any) => boolean = (val: any) => {
      if (typeof val === 'string') return true;
      if (typeof val === 'boolean') return true;
      if (typeof val === 'number') return true;
      if (val instanceof Date) return true;
      return false;
    };
    const intercomValues: Record<string, any> = {
      user_id: id || undefined,
      ref: ref ? ref.path : undefined,
      avatar: photo ? { type: 'avatar', image_url: photo } : undefined,
      ...rest,
    };
    return Object.fromEntries(
      Object.entries(intercomValues)
        .filter(([key, val]) => isFilled(val))
        .map(([key, val]) => [key, isValid(val) ? val : JSON.stringify(val)])
    );
  }

  public toFirestore(): DocumentData {
    return firestoreVals({ ...this, ref: undefined });
  }

  public toString(): string {
    return `${this.name} (${this.id})`;
  }
}
