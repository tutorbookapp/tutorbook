import { MailData } from '@sendgrid/helpers/classes/mail';

export default interface Email extends MailData {
  readonly html: string;
}
