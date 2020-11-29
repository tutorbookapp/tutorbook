import { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import Analytics from 'analytics-node';
import { renderToStaticMarkup } from 'react-dom/server';

import QuaranTunesEmail from 'lib/mail/emails/quarantunes';
import { User } from 'lib/model';
import { db } from 'lib/api/firebase';
import send from 'lib/mail/send';

export default async function quarantunes(req: Req, res: Res): Promise<void> {
  const users = (
    await db
      .collection('users')
      .where('email', '==', 'nicholas.h.chiang@gmail.com')
      .get()
  ).docs.map((d) => User.fromFirestore(d));
  const analytics = new Analytics(process.env.SEGMENT_KEY as string);
  const baseURL = `http://${req.headers.host || 'tutorbook.app'}`;
  await Promise.all(
    users.map(async (user: User) => {
      analytics.identify({ userId: user.id, traits: user.toSegment() });
      analytics.track({ userId: user.id, event: 'QuaranTunes Email Sent' });
      const link =
        `${baseURL}/profile?` +
        `ajs_uid=${encodeURIComponent(user.id)}&` +
        `ajs_event=${encodeURIComponent('QuaranTunes Email Link Clicked')}`;
      const pixelJSON = JSON.stringify({
        writeKey: process.env.SEGMENT_PIXEL_KEY as string,
        event: 'QuaranTunes Email Opened',
        userId: user.id,
      });
      const pixelData = Buffer.from(pixelJSON, 'utf-8').toString('base64');
      const pixel = `https://api.segment.io/v1/pixel/track?data=${pixelData}`;
      const firstName = user.name.split(' ')[0] || user.name;
      return send({
        bcc: { name: 'Tutorbook', email: 'team@tutorbook.org' },
        replyTo: { name: 'Julia Segal', email: 'quarantunes.info@gmail.com' },
        to: { name: user.name, email: user.email },
        subject: `Hi ${firstName}! Could you update your QuaranTunes profile?`,
        html: renderToStaticMarkup(
          <QuaranTunesEmail
            name={firstName}
            email={user.email}
            pixel={pixel}
            link={link}
          />
        ),
      });
    })
  );
  res.status(201).end('QuaranTunes Emails Sent');
}
