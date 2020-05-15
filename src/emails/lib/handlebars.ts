import Handlebars from 'handlebars';
import Utils from '@tutorbook/covid-utils';
import { SocialInterface, RoleAlias } from '@tutorbook/model';

import Check from './shared/check.hbs';
import Cross from './shared/cross.hbs';
import Profile from './shared/profile.hbs';

Handlebars.registerPartial('check', Check);
Handlebars.registerPartial('cross', Cross);
Handlebars.registerPartial('profile', Profile);

/**
 * Custom handlebars helper that joins a list together using 'and'.
 * @example
 * assert(join(['Chemistry', 'Chemistry H']) === 'Chemistry and Chemistry H');
 * assert(join(['A', 'B', 'C', 'D']) === 'A, B, C and D');
 */
Handlebars.registerHelper('join', function (array: any[]): string {
  return Utils.join(array);
});

Handlebars.registerHelper('joinCaps', function (array: string[]): string {
  return Utils.join(array.map((item: string) => Utils.caps(item)));
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
): RoleAlias | 'tutors' | 'pupils' | 'people' | 'person' {
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
 * @todo Don't use the `any` type for `this`.
 * @see {@link https://stackoverflow.com/a/16315366/10023158}
 */
Handlebars.registerHelper('ifCond', function <T = any>(
  this: any,
  v1: T,
  operator: '==' | '===' | '!=' | '!==' | '<' | '<=' | '>' | '>=' | '&&' | '||',
  v2: T,
  options: Handlebars.HelperOptions
): string {
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

/**
 * Helper that creates a comma separated string of socials links.
 * @todo Use `Intl` messages for i18n support.
 */
Handlebars.registerHelper('socials', function (
  socials: SocialInterface[]
): string {
  const labels: Record<string, string> = {
    website: 'Portfolio',
    linkedin: 'LinkedIn',
    facebook: 'Facebook',
    instagram: 'Instagram',
    github: 'GitHub',
  };
  return socials
    .map(
      (social: SocialInterface) =>
        `<a href='${social.url}' target='_blank'>${labels[social.type]}</a>`
    )
    .join(', ');
});

export default Handlebars;
