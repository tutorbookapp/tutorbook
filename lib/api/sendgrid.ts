import mail from '@sendgrid/mail';

import { APIError } from 'lib/api/error';
import { Email } from 'lib/emails';

export default async function send(email: Email): Promise<void> {
  if (process.env.APP_ENV === 'test') {
    console.warn('[WARNING] Skipping emails during tests...');
  } else if (typeof process.env.SENDGRID_API_KEY !== 'string') {
    throw new APIError('Cannot send emails without SendGrid API key.');
  } else {
    mail.setApiKey(process.env.SENDGRID_API_KEY);
    await mail.send(email);
  }
}
