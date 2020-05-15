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

export default Handlebars;
