import { MailData } from '@sendgrid/helpers/classes/mail';

export type Email = {
  html: string;
  replyTo?: { name?: string; email: string };
  from?: { name?: string; email: string };
  to: { name?: string; email: string }[];
} & Omit<MailData, 'replyTo' | 'from' | 'to'>;
