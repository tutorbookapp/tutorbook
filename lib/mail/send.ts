import { ReactElement } from 'react';
import postmark from 'postmark';
import { renderToStaticMarkup } from 'react-dom/server';
import to from 'await-to-js';

import { APIError } from 'lib/model/error';

export interface Email {
  subject: string;
  template: ReactElement;
  to: { name?: string; email: string }[];
  cc?: { name?: string; email: string }[];
  replyTo?: { name?: string; email: string };
}

export default async function send(email: Email): Promise<void> {
  if (['development', 'test'].includes(process.env.APP_ENV as string)) return;
  if (typeof process.env.POSTMARK_API_KEY !== 'string') {
    throw new APIError('Cannot send emails without Postmark API key.');
  } else {
    const client = new postmark.ServerClient(process.env.POSTMARK_API_KEY);
    const [e] = await to(
      client.sendEmail({
        From: 'team@tutorbook.org',
        Bcc: 'team@tutorbook.org',
        To: email.to.map((u) => u.email).join(', '),
        Cc: email.cc?.map((u) => u.email).join(', '),
        ReplyTo: email.replyTo?.email,
        Subject: email.subject,
        HtmlBody: renderToStaticMarkup(email.template),
      })
    );
    if (e) throw new APIError(`${e.name} sending email: ${e.message}`, 500);
  }
}
