import Utils from '@tutorbook/utils';
import { Appt, AttendeeInterface, User, UserWithRoles } from '@tutorbook/model';

import { Email } from '../common';
import Handlebars from '../handlebars';
import Template from './template.hbs';

interface Data {
  attendees: UserWithRoles[];
  recipient: UserWithRoles;
  appt: Appt;
}

/**
 * The email that is sent to all the appointment attendees once we receive
 * parental approval for a pending lesson request. This emails contains the link
 * to the Bramble room and instructions for how to make the most out of the
 * virtual tutoring session.
 */
export class ApptEmail implements Email {
  private static readonly render: Handlebars.TemplateDelegate<
    Data
  > = Handlebars.compile(Template);
  public readonly from: string = 'Tutorbook <team@tutorbook.org>';
  public readonly bcc: string = 'team@tutorbook.org';
  public readonly to: string;
  public readonly subject: string;
  public readonly html: string;
  public readonly text: string;

  private addRoles(user: User): UserWithRoles {
    const attendee: AttendeeInterface | undefined = this.appt.attendees.find(
      (attendee: AttendeeInterface) => attendee.uid === user.uid
    );
    return Object.assign(Object.assign({}, user), {
      roles: attendee ? attendee.roles : [],
    });
  }

  private get attendeesWithRoles(): UserWithRoles[] {
    return this.attendees.map((attendee: User) => this.addRoles(attendee));
  }

  private get recipientWithRoles(): UserWithRoles {
    return this.addRoles(this.recipient);
  }

  public constructor(
    private readonly recipient: User,
    private readonly appt: Appt,
    private readonly attendees: ReadonlyArray<User>
  ) {
    this.to = recipient.email;
    this.subject = `You now have ${Utils.join(
      appt.subjects
    )} lessons on Tutorbook!`;
    this.text = this.subject;
    const data: Data = {
      recipient: this.recipientWithRoles,
      attendees: this.attendeesWithRoles,
      appt: this.appt,
    };
    this.html = ApptEmail.render(data);
  }
}
