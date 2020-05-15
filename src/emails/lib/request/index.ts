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

/**
 * Email sent out to the pupil `attendees` of a new pending lesson request to
 * let them know that we've received their request and are awaiting parental
 * approval.
 * @todo Give the pupils an option to change their parent's contact info in
 * that second email (i.e. you might have entered fake stuff just to see search
 * results and now you can't do anything because those parental emails aren't
 * going where they should be).
 */
export class RequestEmail implements Email {
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
    this.subject = `Request confirmation for ${Utils.join(
      appt.subjects
    )} lessons on Tutorbook.`;
    this.text = this.subject;
    const data: Data = {
      recipient: this.recipientWithRoles,
      attendees: this.attendeesWithRoles,
      appt: this.appt,
    };
    this.html = RequestEmail.render(data);
  }
}
