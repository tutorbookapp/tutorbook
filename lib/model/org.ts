import * as admin from 'firebase-admin';

import { Aspect } from './user';
import { Account, AccountInterface } from './account';
import construct from './construct';

type DocumentData = admin.firestore.DocumentData;
type DocumentSnapshot = admin.firestore.DocumentSnapshot;

/**
 * Duplicate definition from the `lib/react-intercom` package. These are
 * all the valid datatypes for custom Intercom user attributes.
 * @see {@link https://www.intercom.com/help/en/articles/179-send-custom-user-attributes-to-intercom}
 */
type IntercomCustomAttribute = string | boolean | number | Date;

type SignupConfig = {
  [locale: string]: { [key in Aspect]?: { header: string; body: string } };
};

/**
 * An `Org` object represents a non-profit organization that is using Tutorbook
 * to manage their virtual tutoring programs.
 * @typedef {Object} Org
 * @property members - An array of user UIDs that are members of this org.
 * @property safeguarding - A description of the org's safeguarding policy (i.e.
 * what they do to vet their volunteers before adding them to the search view).
 * @property aspects - The supported aspects of a given org (i.e. are they more
 * focused on `tutoring` or `mentoring`). The first one listed is the default.
 */
export interface OrgInterface extends AccountInterface {
  members: string[];
  safeguarding: string;
  aspects: Aspect[];
  signup: SignupConfig;
}

export type OrgJSON = OrgInterface;

export function isOrgJSON(json: any): json is OrgJSON {
  return (json as OrgJSON).members !== undefined;
}

export class Org extends Account implements OrgInterface {
  public members: string[] = [];

  public safeguarding = '';

  public aspects: Aspect[] = ['tutoring'];

  public signup: SignupConfig = {
    en: {
      mentoring: {
        header: 'Guide the next generation',
        body:
          "Help us redefine mentorship. We're connecting high performing and " +
          'underserved 9-12 students with experts (like you) to collaborate ' +
          "on meaningful projects that you're both passionate about. " +
          'Complete the form below to create your profile and sign-up as a ' +
          'mentor.',
      },
      tutoring: {
        header: 'Support students throughout COVID',
        body:
          'Help us support the millions of K-12 students who no longer have ' +
          "individualized instruction due to COVID-19. We're making sure " +
          'that no one loses out on education in these difficult times by ' +
          'connecting students with free, volunteer tutors like you.',
      },
    },
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
        .filter(([_, val]) => isFilled(val))
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
