import { MailData } from '@sendgrid/helpers/classes/mail';
import { ReactElement } from 'react';
import mail from '@sendgrid/mail';
import { renderToStaticMarkup } from 'react-dom/server';
import to from 'await-to-js';

import { APIError } from 'lib/model/error';

export type Email = {
  template: ReactElement;
  replyTo?: { name?: string; email: string };
  from?: { name?: string; email: string };
  to: { name?: string; email: string }[];
} & Omit<MailData, 'replyTo' | 'from' | 'to'>;

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
        html: renderToStaticMarkup(email.template),
        to: email.to.filter((p) => p.email),
      })
    );
    if (e) throw new APIError(`${e.name} sending email: ${e.message}`, 500);
  }
}
