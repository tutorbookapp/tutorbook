import Utils from 'lib/utils';
import { Appt, User, RoleAlias, UserWithRoles, Attendee } from 'lib/model';

import { Email } from '../common';
import Handlebars from '../handlebars';
import Template from './template.hbs';

/**
 * Data used to render the appointment email.
 * @property appt - The appointment the email is about.
 * @property creator - The creator of the `appt`.
 * @property creatorEmail - The creator's email handle.
 * @property withMessage - Either 'with you' or 'between you and [student.name]'
 * if the student isn't the creator of the appointment (i.e. if the appointment
 * was created by their parent or an org admin).
 */
interface Data {
  appt: Appt;
  creator: User;
  creatorEmail: string;
  withMessage: string;
}

interface EmailData {
  name: string;
  email: string;
}

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

function hasRoles(user: UserWithRoles, roles: RoleAlias[]): boolean {
  return roles.some((role: RoleAlias) => user.roles.indexOf(role) >= 0);
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
 *
 * > Hi there,
 * >
 * > [creator.name] wants to setup an appointment [with you][between you and
 * > [student.name]] for [subjects]:
 * >
 * > > [message]
 * >
 * > If you're interested, please get in touch with [creator.name] by replying
 * > to this email or using the following email address:
 * >
 * > [creator.handle]@mail.tutorbook.org
 * >
 * > Thank you.
 */
export default class ApptEmail implements Email {
  private static readonly render: Handlebars.TemplateDelegate<
    Data
  > = Handlebars.compile(Template);

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
    const tutors = attendees.filter(
      (a) => a.id !== creator.id && hasRoles(a, ['mentor', 'tutor'])
    );
    const pupils = attendees.filter(
      (a) => a.id !== creator.id && hasRoles(a, ['mentee', 'tutee'])
    );
    const withMessage =
      attendees.findIndex(({ id }) => id === creator.id) >= 0
        ? 'with you'
        : `between you and ${Utils.join(pupils.map(({ name }) => name))}`;
    const creatorEmail = getEmail(appt, creator.id);

    this.to = tutors.map(({ name, id }) => ({
      name,
      email: getEmail(appt, id),
    }));
    this.replyTo = { name: creator.name, email: creatorEmail };
    this.headers = {
      'Mail-Reply-To': `${creator.name} <${creatorEmail}>`,
      'Mail-Followup-To': pupils
        .map(({ name, id }) => `${name} <${getEmail(appt, id)}>`)
        .join(', '),
    };

    this.subject = `New ${Utils.join(appt.subjects)} appointment on Tutorbook.`;
    this.html = ApptEmail.render({ appt, creator, creatorEmail, withMessage });
    this.text = `Hi there,

      ${
        creator.name
      } wants to setup an appointment ${withMessage} for ${Utils.join(
      appt.subjects
    )}:

      > ${appt.message}
      
      If you're interested, please get in touch with ${
        creator.name
      } by replying to this email or using the following email address:

      ${creatorEmail}

      Thank you.`;
  }
}
