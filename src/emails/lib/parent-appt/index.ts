import Email from '../email';
import Handlebars from '../handlebars';

import Utils from '@tutorbook/covid-utils';
import { Appt, AttendeeInterface, User, RoleAlias } from '@tutorbook/model';

import Template from './template.hbs';

type UserWithRoles = User & { roles: RoleAlias[] };

interface Data {
  brambleDescription: string;
  pupil: User;
  parent: User;
  attendees: UserWithRoles[];
  appt: Appt;
}

export class ParentApptEmail implements Email {
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

  public constructor(
    private readonly parent: User,
    private readonly pupil: User,
    private readonly appt: Appt,
    private readonly attendees: ReadonlyArray<User>
  ) {
    this.to = parent.email;
    this.subject = `${pupil.firstName} scheduled ${Utils.join(
      appt.subjects
    )} lessons on Tutorbook!`;
    this.text = this.subject;
    const data: Data = {
      brambleDescription:
        `They will be conducting their tutoring lessons via <a href='` +
        `${this.appt.venues[0].url}'>this Bramble room</a>. The room will be ` +
        `reused weekly until the tutoring lesson is canceled. Learn more ` +
        `about Bramble <a href='https://about.bramble.io/help/help-home.html'` +
        `>here</a>.`,
      pupil: pupil,
      parent: parent,
      attendees: this.attendeesWithRoles,
      appt: this.appt,
    };
    this.html = ParentApptEmail.render(data);
  }
}
