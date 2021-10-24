import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import Mail from 'pages/mail';

import send from 'lib/mail/send';

export default async function mail(req: Req, res: Res): Promise<void> {
  await send({
    to: [{ name: 'Nicholas Chiang', email: 'nicholas@tutorbook.org' }],
    subject: 'Erik canceled your computer science meeting',
    template: <Mail />,
  });
  res.status(200).end('Email Sent');
}
