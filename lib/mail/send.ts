import { ReactElement } from 'react';
import { ServerClient } from 'postmark';
import { renderToStaticMarkup } from 'react-dom/server';
import to from 'await-to-js';

import { APIError } from 'lib/model/error';

export type EmailStream =
  | 'login'
  | 'request'
  | 'user-created'
  | 'meeting-created'
  | 'meeting-updated'
  | 'meeting-deleted'
  | 'meeting-24hr'
  | 'meeting-1hr'
  | 'meeting-recur';

export interface Email {
  subject: string;
  stream: EmailStream;
  template: ReactElement;
  to: { name?: string; email: string }[];
  cc?: { name?: string; email: string };
  replyTo?: { name?: string; email: string };
}

export default async function send(email: Email): Promise<void> {
  if (['development', 'test'].includes(process.env.APP_ENV as string)) return;
  const key = email.stream.includes('meeting') ? 
    process.env.POSTMARK_MTGS_KEY : 
    process.env.POSTMARK_API_KEY;
  const client = new ServerClient(key as string);
  const [e] = await to(
    client.sendEmail({
      From: 'team@tutorbook.org',
      Bcc: 'team@tutorbook.org',
      To: email.to.map((u) => u.email).join(', '),
      Cc: email.cc?.email,
      ReplyTo: email.replyTo?.email,
      Subject: email.subject,
      HtmlBody: renderToStaticMarkup(email.template),
      MessageStream: email.stream,
    })
  );
  if (e) throw new APIError(`${e.name} sending email: ${e.message}`, 500);
}
