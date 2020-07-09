import Utils from 'lib/utils';
import { Appt, User } from 'lib/model';

import { Email } from '../common';
import Handlebars from '../handlebars';
import Template from './template.hbs';

interface Data {
  appt: Appt;
  creator: User;
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

  public readonly from: string = 'Tutorbook <team@tutorbook.org>';

  public readonly bcc: string = 'team@tutorbook.org';

  public readonly cc: string;

  public readonly to: string[];

  public readonly subject: string;

  public readonly html: string;

  public readonly text: string;

  public constructor(appt: Appt, attendees: User[], creator: User) {
    this.to = attendees
      .filter((a: User) => a.id !== creator.id)
      .map((a: User) => `${a.id}-${appt.id as string}@mail.tutorbook.org`);
    this.cc = `${creator.id}-${appt.id as string}@mail.tutorbook.org`;
    this.subject = `${Utils.join(appt.subjects)} appointment on Tutorbook.`;
    this.text = this.subject;
    this.html = ApptEmail.render({ appt, creator });
  }
}
