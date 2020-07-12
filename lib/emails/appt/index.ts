import Utils from 'lib/utils';
import { Appt, User, Attendee } from 'lib/model';
import { EmailData } from '@sendgrid/helpers/classes/email-address';

import { Email } from '../common';
import Handlebars from '../handlebars';
import Template from './template.hbs';

interface Data {
  appt: Appt;
  creator: User;
  creatorEmail: string;
}

/**
 * Gets the given user's unique all-lowercase anonymous email handle from a
 * given appt.
 */
function getHandle(appt: Appt, id: string): string {
  const match: Attendee[] = appt.attendees.filter((a: Attendee) => a.id === id);
  if (match.length > 1) console.warn(`[WARNING] Duplicate attendees (${id}).`);
  if (match.length < 1) throw new Error(`No attendee ${id} in appt.`);
  return match[0].handle;
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

  public constructor(appt: Appt, attendees: User[], creator: User) {
    this.to = attendees
      .filter((attendee: User) => attendee.id !== creator.id)
      .map((attendee: User) => ({
        name: attendee.name,
        email: `${getHandle(appt, attendee.id)}@mail.tutorbook.org`,
      }));
    this.subject = `New ${Utils.join(appt.subjects)} appointment on Tutorbook.`;
    this.text = this.subject;

    const creatorEmail = `${getHandle(appt, creator.id)}@mail.tutorbook.org`;

    this.replyTo = { name: creator.name, email: creatorEmail };
    this.html = ApptEmail.render({ appt, creator, creatorEmail });
  }
}
