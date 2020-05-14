import Email from '../email';
import Handlebars from '../handlebars';

import Utils from '@tutorbook/covid-utils';
import { Appt, AttendeeInterface, User, RoleAlias } from '@tutorbook/model';

import Template from './template.hbs';

type UserWithRoles = User & { roles: RoleAlias[] };

interface Data {
  attendees: UserWithRoles[];
  recipient: UserWithRoles;
  appt: Appt;
}

export class ApptEmail implements Email {
  private static readonly render: Handlebars.TemplateDelegate<
    Data
  > = Handlebars.compile(Template);
  public readonly from: string = 'Tutorbook <team@tutorbook.org>';
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
