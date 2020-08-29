import * as admin from 'firebase-admin';

import { Account, AccountInterface } from './account';
import { Aspect } from './user';
import construct from './construct';

type DocumentData = admin.firestore.DocumentData;
type DocumentSnapshot = admin.firestore.DocumentSnapshot;

/**
 * Duplicate definition from the `lib/react-intercom` package. These are
 * all the valid datatypes for custom Intercom user attributes.
 * @see {@link https://www.intercom.com/help/en/articles/179-send-custom-user-attributes-to-intercom}
 */
type IntercomCustomAttribute = string | boolean | number | Date;

type PageConfig<T> = { [locale: string]: T };
type AspectPageConfig<T> = PageConfig<{ [key in Aspect]?: T }>;

type SignupPageConfig = AspectPageConfig<{ header: string; body: string }>;
type HomePageConfig = PageConfig<{
  header: string;
  body: string;
  photo?: string;
}>;

/**
 * The only two Zoom OAuth scopes that we ever will request access to.
 * @see {@link https://github.com/tutorbookapp/tutorbook/issues/100}
 * @see {@link https://marketplace.zoom.us/docs/guides/auth/oauth/oauth-scopes}
 */
export type ZoomScope = 'meeting:write:admin' | 'user:write:admin';

/**
 * An authentication config for a certain Zoom account. This enables us to call
 * Zoom APIs on behalf of a user or org (using OAuth patterns).
 * @typedef {Object} ZoomAccount
 * @property id - The Zoom account ID that has given us authorization.
 * @property token - The Zoom `refresh_token` we can use to access Zoom APIs.
 * @property scopes - The scopes that `refresh_token` gives us access to.
 * @see {@link https://github.com/tutorbookapp/tutorbook/issues/100}
 * @see {@link https://marketplace.zoom.us/docs/guides/auth/oauth}
 */
export interface ZoomAccount {
  id: string;
  token: string;
  scopes: ZoomScope[];
}

/**
 * An `Org` object represents a non-profit organization that is using Tutorbook
 * to manage their virtual tutoring programs.
 * @typedef {Object} Org
 * @property members - An array of user UIDs that are members of this org.
 * @property safeguarding - A description of the org's safeguarding policy (i.e.
 * what they do to vet their volunteers before adding them to the search view).
 * @property aspects - The supported aspects of a given org (i.e. are they more
 * focused on `tutoring` or `mentoring`). The first one listed is the default.
 * @property signup - Configuration for the org's unique custom sign-up page.
 * @property home - Configuration for the org's unique custom landing homepage.
 * @property [zoom] - This org's Zoom OAuth config. Used to create meetings and
 * (optionally) users.
 */
export interface OrgInterface extends AccountInterface {
  members: string[];
  safeguarding: string;
  aspects: Aspect[];
  signup: SignupPageConfig;
  home: HomePageConfig;
  zoom?: ZoomAccount;
}

export type OrgJSON = Omit<OrgInterface, 'zoom'> & { zoom: ZoomAccount | null };

export function isOrgJSON(json: any): json is OrgJSON {
  return (json as OrgJSON).members !== undefined;
}

export class Org extends Account implements OrgInterface {
  public members: string[] = [];

  public safeguarding = '';

  public aspects: Aspect[] = ['tutoring'];

  public signup: SignupPageConfig = {
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

  public home: HomePageConfig = {
    en: {
      header: 'How it works',
      photo: 'https://assets.tutorbook.org/jpgs/rocky-beach.jpg',
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

  public zoom?: ZoomAccount;

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
    const { zoom, ...rest } = json;
    return new Org({ zoom: zoom || undefined, ...rest });
  }

  public toJSON(): OrgJSON {
    const { ref, zoom, ...rest } = this;
    return { zoom: zoom || null, ...rest };
  }
}
