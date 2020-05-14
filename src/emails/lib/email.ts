import { MailData } from '@sendgrid/helpers/classes/mail';
import { User } from '@tutorbook/model';

export default interface Email extends MailData {
  readonly recipient: User;
  readonly html: string;
}
