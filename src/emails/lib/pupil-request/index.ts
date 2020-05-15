import Email from '../email';
import Handlebars from '../handlebars';

import Utils from '@tutorbook/covid-utils';
import { Appt, AttendeeInterface, User, UserWithRoles } from '@tutorbook/model';

import Template from './template.hbs';

interface Data {
  pupil: User;
  attendees: UserWithRolesAndVerifications[];
  appt: Appt;
}

/**
 * These are types copied over from './src/emails/lib/parent-request/index.ts`.
 * @todo Refactor the `@tutorbook/emails` package such that these type
 * definitions aren't duplicated.
 */
type VerficationTypeAlias = SocialTypeAlias | 'school';

interface VerificationInterface extends SocialInterface {
  label: string;
}

type UserWithRolesAndVerifications = UserWithRoles & {
  verifications: { [type in VerificationTypeAlias]: VerificationInterface };
};

/**
 * Email sent out to the pupil `attendees` of a new pending lesson request to
 * let them know that we've received their request and are awaiting parental
 * approval.
 * @todo Give the pupils an option to change their parent's contact info in
 * that second email (i.e. you might have entered fake stuff just to see search
 * results and now you can't do anything because those parental emails aren't
 * going where they should be).
 */
export class PupilRequestEmail implements Email {
  private static readonly render: Handlebars.TemplateDelegate<
    Data
  > = Handlebars.compile(Template);
  public readonly from: string = 'Tutorbook <team@tutorbook.org>';
  public readonly to: string;
  public readonly subject: string;
  public readonly html: string;
  public readonly text: string;

  private addVerifications(user: UserWithRoles): UserWithRolesAndVerifications {
    return Object.assign(Object.assign({}, user), {
      verifications: Object.fromEntries(
        user.socials.map((social: SocialInterface) => {
          const { type, ...rest } = social;
          return [type, { label: Utils.caps(type), ...rest }];
        })
      ),
    });
  }

  public constructor(
    pupil: UserWithRoles,
    appt: Appt,
    attendees: ReadonlyArray<UserWithRoles>
  ) {
    this.to = pupil.email;
    this.subject = `Request confirmation for ${Utils.join(
      appt.subjects
    )} lessons on Tutorbook.`;
    this.text = this.subject;
    this.html = PupilRequestEmail.render({
      appt,
      pupil,
      attendees: attendees.map((a: UserWithRoles) => this.addVerifications(a)),
    });
  }
}
