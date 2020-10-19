import mail from '@sendgrid/mail';
import to from 'await-to-js';

import { Match, User, UserWithRoles } from 'lib/model';
import { APIError } from 'lib/api/error';
import { MatchEmail } from 'lib/emails';

mail.setApiKey(process.env.SENDGRID_API_KEY as string);

export default async function createMatchNotification(
  match: Match,
  people: UserWithRoles[],
  creator: User
): Promise<void> {
  const [err] = await to(mail.send(new MatchEmail(match, people, creator)));
  if (err) {
    const msg = `${err.name} creating match (${match.toString()}) notification`;
    throw new APIError(`${msg}: ${err.message}`, 500);
  }
}
