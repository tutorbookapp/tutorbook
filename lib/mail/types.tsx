import { MailData } from '@sendgrid/helpers/classes/mail';

export type Email = { html: string } & Omit<MailData, 'from'>;
