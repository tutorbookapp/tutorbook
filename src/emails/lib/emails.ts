import Handlebars from 'handlebars';
import Utils from '@tutorbook/covid-utils';

import { RoleAlias } from '@tutorbook/model';
import { MailDataRequired } from '@sendgrid/helpers/classes/mail';
import { HelperOptions } from 'handlebars';

import ApptEmailTemplate from './hbs/appt.hbs';

/**
 * Custom handlebars helper that joins a list together using 'and'.
 * @example
 * assert(join(['Chemistry', 'Chemistry H']) === 'Chemistry and Chemistry H');
 * assert(join(['A', 'B', 'C', 'D']) === 'A, B, C and D');
 */
Handlebars.registerHelper('join', function (array: any[]): string {
  return Utils.join(array);
});

/**
 * Custom handlebars helper that returns the first role a user is **not**.
 * @example
 * assert(roles(['tutor'], 3) === 'pupils');
 * assert(roles(['tutor'], 2) === 'pupil');
 * assert(roles(['pupil'], 3) === 'tutors');
 * assert(roles(['pupil'], 2) === 'tutor');
 * assert(roles(['tutor', 'pupil'], 3) === 'people');
 * assert(roles(['tutor', 'pupil'], 2) === 'person');
 */
Handlebars.registerHelper('roles', function (
  roles: RoleAlias[],
  numOfAttendees: number = 2
): RoleAlias {
  if (roles.indexOf('tutor') >= 0 && roles.indexOf('pupil') >= 0) {
    return numOfAttendees > 2 ? 'people' : 'person';
  } else if (roles.indexOf('tutor') >= 0) {
    return numOfAttendees > 2 ? 'pupils' : 'pupil';
  } else if (roles.indexOf('pupil') >= 0) {
    return numOfAttendees > 2 ? 'tutors' : 'tutor';
  } else {
    return numOfAttendees > 2 ? 'people' : 'person';
  }
});

/**
 * Custom handlebars helper that actually provides `if` functionality.
 * @see {@link https://stackoverflow.com/a/16315366/10023158}
 */
Handlebars.registerHelper('ifCond', function <T = any>(
  v1: T,
  operator: '==' | '===' | '!=' | '!==' | '<' | '<=' | '>' | '>=' | '&&' | '||',
  v2: T,
  options: HelperOptions
): boolean {
  switch (operator) {
    case '==':
      return v1 == v2 ? options.fn(this) : options.inverse(this);
    case '===':
      return v1 === v2 ? options.fn(this) : options.inverse(this);
    case '!=':
      return v1 != v2 ? options.fn(this) : options.inverse(this);
    case '!==':
      return v1 !== v2 ? options.fn(this) : options.inverse(this);
    case '<':
      return v1 < v2 ? options.fn(this) : options.inverse(this);
    case '<=':
      return v1 <= v2 ? options.fn(this) : options.inverse(this);
    case '>':
      return v1 > v2 ? options.fn(this) : options.inverse(this);
    case '>=':
      return v1 >= v2 ? options.fn(this) : options.inverse(this);
    case '&&':
      return v1 && v2 ? options.fn(this) : options.inverse(this);
    case '||':
      return v1 || v2 ? options.fn(this) : options.inverse(this);
    default:
      return options.inverse(this);
  }
});

export interface Email extends MailDataRequired {
  recipient: User;
}

type UserWithRoles = User & { roles: RoleAlias[] };

Array.prototype.find = function (finder: (any) => boolean): any {
  const index: number = this.findIndex(finder);
  return this[index];
};

export class ApptEmail implements Email {
  private static readonly render = Handlebars.compile(ApptEmailTemplate);
  public readonly from: string = 'Tutorbook <team@tutorbook.org>';
  public readonly to: string;
  public readonly subject: string;
  public readonly html: string;
  public readonly text: string;

  private get attendeesWithRoles(): UserWithRoles[] {
    const addRoles = (user: User): UserWithRoles => {
      const attendee: AttendeeInterface = this.appt.attendees.find(
        (attendee) => attendee.uid === user.uid
      );
      return Object.assign(Object.assign({}, user), { roles: attendee.roles });
    };
    return this.attendees.map((attendee: User) => addRoles(attendee));
  }

  private get recipientWithRoles(): UserWithRoles {
    return this.attendeesWithRoles.find((u) => u.uid === this.recipient.uid);
  }

  public constructor(
    private recipient: User,
    private appt: Appt,
    private attendees: User[]
  ) {
    this.to = `${recipient.name} <${recipient.email}>`;
    //this.subject = `You now have ${Utils.join(appt.subjects)} lessons on Tutorbook!`;
    this.subject = 'This is my third test from the REST API.';
    this.text = this.subject;
    const data: Record<string, any> = Object.assign(Object.assign({}, appt), {
      recipient: this.recipientWithRoles,
      attendees: this.attendeesWithRoles,
    });
    this.html = ApptEmail.render(data);
    debugger;
  }
}
