import Email from '../email';
import Handlebars from '../handlebars';

import Utils from '@tutorbook/covid-utils';
import {
  Appt,
  SocialTypeAlias,
  SocialInterface,
  AttendeeInterface,
  User,
  RoleAlias,
} from '@tutorbook/model';

import Template from './template.hbs';
import Check from './partials/check.hbs';
import Cross from './partials/cross.hbs';
import Profile from './partials/profile.hbs';

Handlebars.registerPartial('check', Check);
Handlebars.registerPartial('cross', Cross);
Handlebars.registerPartial('profile', Profile);

Handlebars.registerHelper('joinCaps', function (array: string[]): string {
  return Utils.join(array.map((item: string) => Utils.caps(item)));
});

type VerficationTypeAlias = SocialTypeAlias | 'school';

interface VerificationInterface extends SocialInterface {
  label: string;
}

type UserWithRolesAndVerifications = User & {
  roles: RoleAlias[];
  verifications: { [type in VerificationTypeAlias]: VerificationInterface };
};

interface Data {
  brambleDescription: string;
  approveURL: string;
  pupil: User;
  parent: User;
  attendees: UserWithRolesAndVerifications[];
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

  private addRolesAndVerifications(user: User): UserWithRolesAndVerifications {
    const attendee: AttendeeInterface | undefined = this.appt.attendees.find(
      (attendee: AttendeeInterface) => attendee.uid === user.uid
    );
    return Object.assign(Object.assign({}, user), {
      roles: attendee ? attendee.roles : [],
      verifications: Object.fromEntries(
        user.socials.map((social: SocialInterface) => {
          const { type, ...rest } = social;
          return [type, { label: Utils.caps(type), ...rest }];
        })
      ),
    });
  }

  private get attendeesWithRolesAndVerifications(): UserWithRolesAndVerifications[] {
    return this.attendees.map((attendee: User) =>
      this.addRolesAndVerifications(attendee)
    );
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
    const linkStyling: string = `color:#067df7!important;font-size:inherit;text-decoration:none`;
    const data: Data = {
      approveURL: `https://tutorbook.org/approve?appt=${appt.id}&uid=${parent.uid}`,
      brambleDescription:
        `They will be conducting their tutoring lessons via <a href="` +
        `${appt.venues[0].url}" style="${linkStyling}">this Bramble room</a>.` +
        ` The room will be reused weekly until the tutoring lesson is ` +
        `canceled. Learn more about Bramble <a href="https://about.bramble.` +
        `io/help/help-home.html" style="${linkStyling}">here</a>.`,
      attendees: this.attendeesWithRolesAndVerifications,
      appt,
      pupil,
      parent,
    };
    this.html = ParentApptEmail.render(data);
    debugger;
  }
}
