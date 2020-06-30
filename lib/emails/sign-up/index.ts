import { User, UserWithRoles, RoleAlias } from 'lib/model';

import {
  Email,
  UserWithRolesAndVerifications,
  addVerifications,
} from '../common';
import Handlebars from '../handlebars';
import Template from './template.hbs';

export default class SignUpEmail implements Email {
  private static readonly render: Handlebars.TemplateDelegate<
    UserWithRolesAndVerifications
  > = Handlebars.compile(Template);

  public readonly from: string = 'Tutorbook <team@tutorbook.org>';

  public readonly to: string = 'team@tutorbook.org';

  public readonly subject: string;

  public readonly html: string;

  public readonly text: string;

  public constructor(user: User) {
    this.subject = `${user.toString()} just signed up on Tutorbook!`;
    this.text = this.subject;
    const roles: RoleAlias[] = [];
    if (user.tutoring.searches.length > 0) roles.push('tutee');
    if (user.tutoring.subjects.length > 0) roles.push('tutor');
    if (user.mentoring.searches.length > 0) roles.push('mentee');
    if (user.mentoring.subjects.length > 0) roles.push('mentor');
    const userWithRoles = user as UserWithRoles;
    userWithRoles.roles = roles;
    this.html = SignUpEmail.render(addVerifications(userWithRoles));
  }
}
