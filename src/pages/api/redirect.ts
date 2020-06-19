import { NextApiRequest, NextApiResponse } from 'next';
import { locales, defaultLocale } from '@tutorbook/intl';
import parser from 'accept-language-parser';

/**
 * Redirects to a locale based on the HTTP request `Accept-Language` header.
 * This API endpoint is called via the experimental Next.js rewrites feature
 * (see the `next.config.js` file in the root of this repository).
 *
 * @example `/` => `/fr`
 * @example `/search` => `/de/search`
 * @example `/end` => `/en/end`
 *
 * @see {@link https://github.com/zeit/next.js/issues/9081}
 * @see {@link https://github.com/UnlyEd/next-right-now/pull/42}
 * @see {@link https://github.com/tutorbookapp/covid-tutoring/issues/35}
 */
export default function redirect(
  req: NextApiRequest,
  res: NextApiResponse<void>
): void {
  const locale: string =
    parser.pick(locales, req.headers['accept-language'] || '') || defaultLocale;
  const url: string = req.url as string;
  console.log(`[DEBUG] Redirecting to locale (${locale})...`);
  res.statusCode = 302;
  res.setHeader('Location', `/${locale}${url}`);
  res.end();
  console.log(`[DEBUG] Redirected '${url}' to '/${locale}${url}'.`);
}
