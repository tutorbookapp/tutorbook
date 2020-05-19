import { User, UserWithRoles, RoleAlias } from '@tutorbook/model';

import {
  Email,
  UserWithRolesAndVerifications,
  addVerifications,
} from '../common';
import Handlebars from '../handlebars';
import Template from './template.hbs';

export class SignUpEmail implements Email {
  private static readonly render: Handlebars.TemplateDelegate<
    UserWithRolesAndVerifications
  > = Handlebars.compile(Template);
  public readonly from: string = 'Tutorbook <team@tutorbook.org>';
  public readonly to: string = 'team@tutorbook.org';
  public readonly subject: string;
  public readonly html: string;
  public readonly text: string;

  private addVerifications(user: UserWithRoles): UserWithRolesAndVerifications {
    return Object.assign(Object.assign({}, user), {
      verifications: Object.fromEntries(
        user.socials.map((social: SocialInterface) => {
          const { type, ...rest } = social;
          return [
            type as SocialTypeAlias,
            { label: Utils.caps(type), ...rest },
          ];
        })
      ),
    }) as UserWithRolesAndVerifications;
  }

  public constructor(user: User) {
    this.subject = `${user} just signed up on Tutorbook!`;
    this.text = this.subject;
    const roles: RoleAlias[] = [];
    if (user.searches.explicit.length > 0) roles.push('pupil');
    if (user.subjects.explicit.length > 0) roles.push('tutor');
    (user as UserWithRoles).roles = roles;
    debugger;
    this.html = SignUpEmail.render(addVerifications(user as UserWithRoles));
    debugger;
  }
}
