import { AWSError } from 'aws-sdk/lib/error';
import S3 from 'aws-sdk/clients/s3';

const s3 = new S3();
const bucketId = 'tutorbook-mail';

interface Header {
  name: string;
  value: string;
}

interface Verdict {
  status: 'PASS' | 'GRAY' | 'FAIL';
}

interface SESNotification {
  mail: {
    timestamp: string;
    source: string;
    messageId: string;
    destination: string[];
    headersTruncated: boolean;
    headers: Header[];
    commonHeaders: {
      returnPath: string;
      from: string[];
      date: string;
      to: string[];
      messageId: string;
      subject: string;
    };
  };
  receipt: {
    timestamp: string;
    processingTimeMillis: number;
    recipients: string[];
    spamVerdict: Verdict;
    virusVerdict: Verdict;
    spfVerdict: Verdict;
    dkimVerdict: Verdict;
    dmarcVerdict: Verdict;
    action: {
      type: 'Lambda';
      functionArn: string;
      invocationType: 'Event' | 'RequestResponse';
    };
  };
}

/**
 * The event that is passed to AWS SES Lambda receipt actions (every time an
 * email is received).
 * @see {@link https://amzn.to/2BQm7WG}
 */
interface MailEvent {
  Records: [
    {
      eventSource: 'aws:ses';
      eventVersion: string;
      ses: SESNotification;
    }
  ];
}

/**
 * An AWS Lambda function that is invoked every time we receive an email. This
 * function:
 * 1. Looks up the sender and recipient of the email in our Firestore database.
 * 2. Updates the `From` and `Reply-To` headers to be the sender's anonymized
 * email address (i.e. their `@mail.tutorbook.org` email address).
 * 3. Fetches the email content from AWS S3 and forwards it to the intended
 * recipient.
 */
/* eslint-disable-next-line import/prefer-default-export */
export function handler(event: MailEvent): void {
  const notification: SESNotification = event.Records[0].ses;
  console.log('[DEBUG] Processing:', JSON.stringify(notification, null, 2));

  function callback(err: AWSError, data: S3.Types.GetObjectOutput): void {
    if (err) {
      console.error(`[ERROR] ${err.name} accessing S3 (${bucketId}):`, err);
    } else {
      console.log('[DEBUG] Raw email body:', data.Body);
    }
  }

  s3.getObject(
    { Bucket: bucketId, Key: notification.mail.messageId },
    callback
  );
}
