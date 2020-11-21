import crypto from 'crypto';

/**
 * Gets the user's HMAC for Intercom's identity-verification features.
 * @see {@link https://www.intercom.com/help/en/articles/183-enable-identity-verification-for-web-and-mobile}
 * @see {@link https://en.wikipedia.org/wiki/HMAC}
 */
export default function getUserHash(uid: string): string {
  const hmac = crypto.createHmac('sha256', process.env.INTERCOM_KEY as string);
  return hmac.update(uid).digest('hex');
}
