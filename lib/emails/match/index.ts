import Utils from 'lib/utils';
import { Match, Org, Role, User, UserWithRoles, Venue } from 'lib/model';

import { Email } from '../common';
import Handlebars from '../handlebars';

import GenericTemplate from './normal.hbs';
import TutoringTemplate from './tutoring.hbs';
import MentoringTemplate from './mentoring.hbs';

/**
 * Data used to render the appointment email.
 * @property match - The appointment the email is about.
 * @property creator - The creator of the `match`.
 * @property creatorEmail - The creator's email handle.
 * @property recipientName - The name of the recipient of the email.
 * @property recipientRoles - The roles of the recipient of the email (i.e. the
 * roles of the person who isn't the creator).
 */
interface GenericData {
  match: Match;
  creator: User;
  creatorEmail: string;
  recipientName: string;
  recipientRoles: Role[];
}

/**
 * Data used to render the org match email (i.e. the email sent when an org admin
 * creates an match they're not attending).
 * @property match - The match the email is about.
 * @property creator - The creator of the match (i.e. the org admin).
 * @property org - The org that the creator is primarily associated with.
 * @property contacts - A list of the people's and creator's contact info.
 * @property personNames - A list of all of the person names.
 * @property rolesDescription - A description of who plays what role in this
 * match (e.g. 'with Bobby as the tutor and Clarisse as the tutee').
 */
interface OrgsData {
  match: Match;
  creator: User;
  org: Org;
  contacts: Contact[];
  personNames: string[];
  rolesDescription: string;
}

/**
 * A row in the contact info table in the org email.
 * @property name - The name of the contact (e.g. "Nicholas C.").
 * @property email - The contact's anonymous email address.
 * @property url - A `mailto` URL that is populated with the contact's name and
 * anonymous email address (we `encodeURIComponents` on this string).
 */
interface Contact {
  name: string;
  email: string;
  url: string;
}

interface EmailData {
  name: string;
  email: string;
}

const generic: Handlebars.TemplateDelegate<GenericData> = Handlebars.compile(
  GenericTemplate
);
const tutoring: Handlebars.TemplateDelegate<OrgsData> = Handlebars.compile(
  TutoringTemplate
);
const mentoring: Handlebars.TemplateDelegate<OrgsData> = Handlebars.compile(
  MentoringTemplate
);

/**
 * Gets the given user's unique all-lowercase anonymous email handle from a
 * given match.
 * @todo Add unit and integration tests for the anonymous email relay such that
 * we can go back to using this. For now, our email relay is inconsistent and
 * thus we're temporarily disabling it and just using the people's actual
 * email addresses.
 */
// function getEmail(
// match: Match,
// id: string,
// domain: string = 'mail.tutorbook.org'
// ): string {
// if (match.creator.id === id) return `${match.creator.handle}@${domain}`;
// const match: Person[] = match.people.filter((a: Person) => a.id === id);
// if (match.length > 1) console.warn(`[WARNING] Duplicate people (${id}).`);
// if (match.length < 1) throw new Error(`No person ${id} in match.`);
// return `${match[0].handle}@${domain}`;
// }

/**
 * Sends one appointment email to all of the people CC-ing the creator of the
 * appointment.
 *
 * This appointment email contains:
 * - The subjects requested.
 * - The time (if any) requested.
 * - The creator's request message (e.g. "I need help with my Trig HW.").
 * - A prompt to reply-all in order to setup a meeting time and venue (we don't
 * force users to use Bramble anymore; they use whatever works best for them).
 *
 * **Note:** We use the people's anonymous email addresses so that our AWS
 * Lambda function can take care of the anonymizing and relay logic (so that
 * each person can only ever see their own direct contact information).
 *
 * - From: team@tutorbook.org (**not** from the creator of the appointment).
 * - To: the tutor and mentor people.
 * - BCC: team@tutorbook.org (for analysis purposes).
 * - Reply-To: the creator of the appointment (typically the student but it
 *   could be their parent or an org admin).
 * - Mail-Reply-To: the creator of the appointment.
 * - Mail-Followup-To: the creator and all people of the appointment.
 */
export default class MatchEmail implements Email {
  public readonly from: EmailData = {
    name: 'Tutorbook',
    email: 'team@tutorbook.org',
  };

  public readonly bcc: EmailData = {
    name: 'Tutorbook',
    email: 'team@tutorbook.org',
  };

  public readonly replyTo: EmailData;

  public readonly to: EmailData[];

  public readonly subject: string;

  public readonly html: string;

  public readonly text: string;

  public constructor(match: Match, people: UserWithRoles[], creator: User) {
    const recipients = people.filter((a) => a.id !== creator.id);
    const creatorEmail = creator.email;
    const personNames = recipients.map(({ name }) => name);
    const contacts = [...recipients, creator].map(({ name, email }) => ({
      name,
      email,
      url: `mailto:${encodeURIComponent(`"${name}"<${email}>`)}`,
    }));
    const rolesDescription = `with ${Utils.join(
      people.map(({ name, roles }) => `${name} as the ${Utils.join(roles)}`)
    )}`;
    const org: Org = new Org({ name: 'Tutorbook' });
    const { roles: recipientRoles, name: recipientName } = recipients[0];

    this.to = recipients.map(({ name, email }) => ({ name, email }));
    this.replyTo = { name: creator.name, email: creatorEmail };
    this.subject = `New ${Utils.join(
      match.subjects
    )} appointment on Tutorbook.`;

    if (recipients.length === 1) {
      this.html = generic({
        match,
        creator,
        creatorEmail,
        recipientName,
        recipientRoles,
      });
      /* prettier-ignore */
      this.text = 
`Hi ${recipientName},

${creator.name} wants you as a ${Utils.join(recipientRoles)} for ${Utils.join(match.subjects)}:

> "${match.message}"
> —${creator.name} 

If you're interested, please get in touch with ${creator.name} by replying to this email or using the following email address:

${creatorEmail}

Thank you.

Tutorbook - tutorbook.org`;
    } else if (match.aspect === 'tutoring') {
      this.html = tutoring({
        match,
        creator,
        org,
        contacts,
        personNames,
        rolesDescription,
      });
      /* prettier-ignore */
      this.text =
`Hi ${Utils.join(personNames)},

You have a new tutoring lesson for ${Utils.join(match.subjects)} (${rolesDescription}).

Please reply to this email stating when you're available to join your first lesson.

Once you figure out a time when everyone's available, simply copy and paste this URL into a new tab of your browser to open:

${(match.bramble as Venue).url}

${creator.name} from ${org.name} set up this lesson:

> "${match.message}"
> —${creator.name} from ${org.name} 

If this doesn't seem like a good match, please get in touch with ${creator.name} by using this email address:

${creatorEmail}

Thank you.

Tutorbook - tutorbook.org`;
    } else {
      this.html = mentoring({
        match,
        creator,
        org,
        contacts,
        personNames,
        rolesDescription,
      });
      /* prettier-ignore */
      this.text =
`Hi ${Utils.join(personNames)},

You have a new mentoring match for ${Utils.join(match.subjects)} (${rolesDescription}).

Please reply to this email stating when you're available to join your first video call.

Once you figure out a time when everyone's available, simply copy and paste this URL into a new tab of your browser to join the video call:

${(match.jitsi as Venue).url}

${creator.name} from ${org.name} set up this lesson:

> "${match.message}"
> —${creator.name} from ${org.name} 

If this doesn't seem like a good match, please get in touch with ${creator.name} by using this email address:

${creatorEmail}

Thank you.

Tutorbook - tutorbook.org`;
    }
  }
}
