import mail from '@sendgrid/mail';
import to from 'await-to-js';

import { APIError } from 'lib/model/error';
import { Email } from 'lib/mail/types';

export default async function send(email: Email): Promise<void> {
  if (['development', 'test'].includes(process.env.APP_ENV as string)) return;
  if (typeof process.env.SENDGRID_API_KEY !== 'string') {
    throw new APIError('Cannot send emails without SendGrid API key.');
  } else {
    mail.setApiKey(process.env.SENDGRID_API_KEY);
    const [e] = await to(
      mail.send({
        ...email,
        from: { name: 'Tutorbook', email: 'team@tutorbook.org' },
        bcc: { name: 'Tutorbook', email: 'team@tutorbook.org' },
        replyTo: email.replyTo?.email ? email.replyTo : undefined,
        to: email.to.filter((p) => p.email),
      })
    );
    if (e) throw new APIError(`${e.name} sending email: ${e.message}`, 500);
  }
}
