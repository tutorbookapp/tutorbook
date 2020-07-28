import * as admin from 'firebase-admin';

import { User, UserInterface, Aspect } from './user';
import { AccountInterface, Account } from './account';

import construct from './construct';

type DocumentData = admin.firestore.DocumentData;
type DocumentSnapshot = admin.firestore.DocumentSnapshot;

/**
 * Duplicate definition from the `lib/react-intercom` package. These are
 * all the valid datatypes for custom Intercom user attributes.
 * @see {@link https://www.intercom.com/help/en/articles/179-send-custom-user-attributes-to-intercom}
 */
type IntercomCustomAttribute = string | boolean | number | Date;

/**
 * Organizational settings.
 * @property aspects - The aspects offered by (available through) the org (e.g.
 * some orgs only use one aspect and thus we don't have to use screen real
 * estate to add aspect tabs).
 * @property profiles - Profile properties that members can or cannot edit. The
 * default is that members can edit all their profile properties.
 * @property notifications - Whether or not to send email notifications to the
 * members of this org (this is useful when an org admin just wants to play
 * around with the app w/out sending any emails).
 */
export interface OrgSettings {
  aspects: Aspect[];
  profiles: Record<keyof UserInterface, boolean>;
  notifications: boolean;
}

/**
 * An `Org` object represents a non-profit organization that is using Tutorbook
 * to manage their virtual tutoring programs.
 * @typedef {Object} Org
 * @property members - An array of user UIDs that are members of this org.
 * @property safeguarding - A description of the org's safeguarding policy (i.e.
 * what they do to vet their volunteers before adding them to the search view).
 * @property aspect - The default aspect of a given org (i.e. are they more
 * focused on `tutoring` or `mentoring`).
 * @property settings - Org settings.
 */
export interface OrgInterface extends AccountInterface {
  members: string[];
  safeguarding: string;
  aspect: Aspect;
  settings: OrgSettings;
}

export type OrgJSON = OrgInterface;

export function isOrgJSON(json: any): json is OrgJSON {
  return (json as OrgJSON).members !== undefined;
}

export class Org extends Account implements OrgInterface {
  public members: string[] = [];

  public safeguarding: string = '';

  public aspect: Aspect = 'mentoring';

  public settings: OrgSettings = {
    aspects: ['mentoring', 'tutoring'],
    profiles: Object.keys(new User()).reduce(
      (o: Record<string, boolean>, k: string) => ({ ...o, [k]: true }),
      {}
    ) as Record<keyof UserInterface, boolean>,
    notifications: true,
  };

  public constructor(org: Partial<OrgInterface> = {}) {
    super(org);
    construct<OrgInterface, AccountInterface>(this, org, new Account());
  }

  /**
   * Converts this `Org` object into a `Record<string, any>` that Intercom
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
    const intercomValues: Record<string, any> = Object.fromEntries(
      Object.entries(rest)
        .filter(([key, val]) => isFilled(val))
        .map(([key, val]) => [key, isValid(val) ? val : JSON.stringify(val)])
    );
    return { ...intercomValues, ...super.toIntercom() };
  }

  public static fromFirestore(snapshot: DocumentSnapshot): Org {
    const orgData: DocumentData | undefined = snapshot.data();
    if (orgData) {
      return new Org({
        ...orgData,
        ref: snapshot.ref,
        id: snapshot.id,
      });
    }
    console.warn(
      `[WARNING] Tried to create account (${snapshot.ref.id}) from ` +
        'non-existent Firestore document.'
    );
    return new Org();
  }

  public static fromJSON(json: OrgJSON): Org {
    return new Org(json);
  }

  public toJSON(): OrgJSON {
    const { ref, ...rest } = this;
    return { ...rest };
  }
}
