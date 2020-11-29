import { MailData } from '@sendgrid/helpers/classes/mail';

export type Email = {
  html: string;
  from?: { name: string; email: string };
} & Omit<MailData, 'from'>;
