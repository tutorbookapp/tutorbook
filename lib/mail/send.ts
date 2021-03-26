import mail from '@sendgrid/mail';
import to from 'await-to-js';

import { APIError } from 'lib/api/error';
import { Email } from 'lib/mail/types';

const from = { name: 'Tutorbook', email: 'team@tutorbook.org' };

export default async function send(email: Email): Promise<void> {
  if (['development', 'test'].includes(process.env.APP_ENV as string)) return;
  if (typeof process.env.SENDGRID_API_KEY !== 'string') {
    throw new APIError('Cannot send emails without SendGrid API key.');
  } else {
    mail.setApiKey(process.env.SENDGRID_API_KEY);
    const [e] = await to(mail.send({ from, bcc: from, ...email }));
    if (e) throw new APIError(`${e.name} sending email: ${e.message}`, 500);
  }
}
