import NextRouter from 'next/router';

import { IntlCache, IntlShape, createIntl, createIntlCache } from 'react-intl';
import { UrlObject } from 'url';

type Url = UrlObject | string;

/**
 * Adds the locale to the given url string or object.
 * @see {@link https://github.com/isaachinman/next-i18next/blob/master/src/utils/lng-path-corrector.ts}
 * @see {@link https://github.com/isaachinman/next-i18next/blob/master/src/router/wrap-router.ts}
 */
function addLocale(url?: Url): Url | undefined {
  const cache: IntlCache = createIntlCache();
  const intl: IntlShape = createIntl(
    {
      locale: 'TODO: Somehow grab locale from outside the React lifecycle.',
    },
    cache
  );
  if (typeof url === 'string') {
    url = `/${intl.locale}${url}`.replace(/\/$/, '');
  } else if (typeof url === 'object') {
    url.pathname = `/${intl.locale}${url.pathname}`.replace(/\/$/, '');
  }
  return url;
}

export class Router extends NextRouter {
  push(url: Url, as?: Url, options?: {}): Promise<boolean> {
    return super.push(addLocale(url), addLocale(as), options);
  }

  replace(url: Url, as?: Url, options?: {}): Promise<boolean> {
    return super.replace(addLocale(url), addLocale(as), options);
  }
}
