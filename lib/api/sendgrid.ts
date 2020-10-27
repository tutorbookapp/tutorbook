import mail from '@sendgrid/mail';

import { APIError } from 'lib/api/error';
import { Email } from 'lib/emails';

export default async function send(email: Email): Promise<void> {
  if (['development', 'test'].includes(process.env.APP_ENV as string)) {
    console.warn(`[WARNING] Skipping emails during tests and development...`);
  } else if (typeof process.env.SENDGRID_API_KEY !== 'string') {
    throw new APIError('Cannot send emails without SendGrid API key.');
  } else {
    mail.setApiKey(process.env.SENDGRID_API_KEY);
    await mail.send(email);
  }
}
