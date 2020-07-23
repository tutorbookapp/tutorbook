import Utils from 'lib/utils';
import {
  Venue,
  Appt,
  Org,
  User,
  Role,
  UserWithRoles,
  Attendee,
} from 'lib/model';

import { Email } from '../common';
import Handlebars from '../handlebars';

import GenericTemplate from './normal.hbs';
import TutoringTemplate from './tutoring.hbs';
import MentoringTemplate from './mentoring.hbs';

/**
 * Data used to render the appointment email.
 * @property appt - The appointment the email is about.
 * @property creator - The creator of the `appt`.
 * @property creatorEmail - The creator's email handle.
 * @property roles - The roles of the recipient of the email (i.e. the attendee
 * who isn't the creator).
 */
interface GenericData {
  appt: Appt;
  creator: User;
  creatorEmail: string;
  roles: Role[];
}

/**
 * Data used to render the org appt email (i.e. the email sent when an org admin
 * creates an appt they're not attending).
 * @property appt - The appt the email is about.
 * @property creator - The creator of the appt (i.e. the org admin).
 * @property org - The org that the creator is primarily associated with.
 * @property contacts - A list of the attendees's and creator's contact info.
 * @property attendeeNames - A list of all of the attendee names.
 * @property rolesDescription - A description of who plays what role in this
 * appt (e.g. 'with Bobby as the tutor and Clarisse as the tutee').
 */
interface OrgsData {
  appt: Appt;
  creator: User;
  org: Org;
  contacts: Contact[];
  attendeeNames: string[];
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
 * given appt.
 */
function getEmail(
  appt: Appt,
  id: string,
  domain: string = 'mail.tutorbook.org'
): string {
  if (appt.creator.id === id) return `${appt.creator.handle}@${domain}`;
  const match: Attendee[] = appt.attendees.filter((a: Attendee) => a.id === id);
  if (match.length > 1) console.warn(`[WARNING] Duplicate attendees (${id}).`);
  if (match.length < 1) throw new Error(`No attendee ${id} in appt.`);
  return `${match[0].handle}@${domain}`;
}

/**
 * Sends one appointment email to all of the attendees CC-ing the creator of the
 * appointment.
 *
 * This appointment email contains:
 * - The subjects requested.
 * - The time (if any) requested.
 * - The creator's request message (e.g. "I need help with my Trig HW.").
 * - A prompt to reply-all in order to setup a meeting time and venue (we don't
 * force users to use Bramble anymore; they use whatever works best for them).
 *
 * **Note:** We use the attendees's anonymous email addresses so that our AWS
 * Lambda function can take care of the anonymizing and relay logic (so that
 * each attendee can only ever see their own direct contact information).
 *
 * - From: team@tutorbook.org (**not** from the creator of the appointment).
 * - To: the tutor and mentor attendees.
 * - BCC: team@tutorbook.org (for analysis purposes).
 * - Reply-To: the creator of the appointment (typically the student but it
 *   could be their parent or an org admin).
 * - Mail-Reply-To: the creator of the appointment.
 * - Mail-Followup-To: the creator and all attendees of the appointment.
 */
export default class ApptEmail implements Email {
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

  public readonly headers: Record<string, string>;

  public constructor(appt: Appt, attendees: UserWithRoles[], creator: User) {
    const recipients = attendees.filter((a) => a.id !== creator.id);
    const creatorEmail = getEmail(appt, creator.id);
    const attendeeNames: string[] = recipients.map(({ name }) => name);
    const contacts: Contact[] = recipients.map(({ name, id }) => ({
      name,
      email: getEmail(appt, id),
      url: encodeURIComponent(`mailto:"${name}"<${getEmail(appt, id)}>`),
    }));
    const rolesDescription = `with ${Utils.join(
      attendees.map(({ name, roles }) => `${name} as the ${Utils.join(roles)}`)
    )}`;
    const org: Org = new Org({ name: 'Tutorbook' });
    const { roles } = recipients[0];

    this.to = recipients.map(({ name, id }) => ({
      name,
      email: getEmail(appt, id),
    }));
    this.replyTo = { name: creator.name, email: creatorEmail };
    this.headers = {
      'Mail-Reply-To': `${creator.name} <${creatorEmail}>`,
      'Mail-Followup-To': recipients
        .map(({ name, id }) => `${name} <${getEmail(appt, id)}>`)
        .join(', '),
    };
    this.subject = `New ${Utils.join(appt.subjects)} appointment on Tutorbook.`;

    if (recipients.length === 1) {
      this.html = generic({ appt, creator, creatorEmail, roles });
      /* prettier-ignore */
      this.text = 
        `Hi there,

        ${creator.name} wants you as a ${Utils.join(roles)} for ${Utils.join(appt.subjects)}:

        > ${appt.message}
        
        If you're interested, please get in touch with ${creator.name} by replying to this email or using the following email address:

        ${creatorEmail}

        Thank you.`;
    } else if (appt.aspect === 'tutoring') {
      this.html = tutoring({
        appt,
        creator,
        org,
        contacts,
        attendeeNames,
        rolesDescription,
      });
      /* prettier-ignore */
      this.text =
        `Hi ${Utils.join(attendeeNames)},

        You have a new tutoring lesson for ${Utils.join(appt.subjects)} (${rolesDescription}).

        Please reply to this email with when you're available to join your first lesson. If you're a parent, no action is necessary (unless your student needs your help to find a time).

        Once you figure out a time when everyone's available, simply copy and paste this URL into a new tab of your browser to open:

        ${(appt.bramble as Venue).url}

        ${creator.name} from ${org.name} set up this lesson:

        > ${appt.message}
        > —${creator.name} from ${org.name} 

        If this doesn't seem like a good match, please get in touch with ${creator.name} by using this email address:

        ${creatorEmail}

        Thank you.`;
    } else {
      this.html = mentoring({
        appt,
        creator,
        org,
        contacts,
        attendeeNames,
        rolesDescription,
      });
      /* prettier-ignore */
      this.text =
        `Hi ${Utils.join(attendeeNames)},

        You have a new mentoring match for ${Utils.join(appt.subjects)} (${rolesDescription}).

        Please reply to this email with when you're available to join your first video call.

        Once you figure out a time when everyone's available, simply copy and paste this URL into a new tab of your browser to join the video call:

        ${(appt.jitsi as Venue).url}

        ${creator.name} from ${org.name} set up this lesson:

        > ${appt.message}
        > —${creator.name} from ${org.name} 

        If this doesn't seem like a good match, please get in touch with ${creator.name} by using this email address:

        ${creatorEmail}

        Thank you.`;
    }
  }
}
