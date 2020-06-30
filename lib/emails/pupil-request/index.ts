import Utils from '@tutorbook/utils';
import { Appt, UserWithRoles } from '@tutorbook/model';

import {
  Email,
  UserWithRolesAndVerifications,
  addVerifications,
} from '../common';
import Handlebars from '../handlebars';
import Template from './template.hbs';

interface Data {
  appt: Appt;
  pupil: UserWithRoles;
  attendees: UserWithRolesAndVerifications[];
  description: string;
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
export default class PupilRequestEmail implements Email {
  private static readonly render: Handlebars.TemplateDelegate<
    Data
  > = Handlebars.compile(Template);

  public readonly from: string = 'Tutorbook <team@tutorbook.org>';

  public readonly bcc: string = 'team@tutorbook.org';

  public readonly to: string;

  public readonly subject: string;

  public readonly html: string;

  public readonly text: string;

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
      attendees: attendees.map((a: UserWithRoles) => addVerifications(a)),
      description:
        pupil.roles.indexOf('tutee') >= 0 && appt.time
          ? `${Utils.join(
              appt.subjects
            )} tutoring lessons on ${appt.time.toString()}`
          : `a cool ${Utils.join(appt.subjects)} project`,
    });
  }
}
