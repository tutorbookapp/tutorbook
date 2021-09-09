import { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { renderToStaticMarkup } from 'react-dom/server';

import Mail from 'pages/meeting-mail';

import send from 'lib/mail/send';

export default async function mail(req: Req, res: Res): Promise<void> {
  await send({
    to: [{ name: 'Nicholas Chiang', email: 'nicholas.h.chiang@gmail.com' }],
    cc: { name: 'Erik Lucatero', email: 'erik@example.com' },
    subject: 'Erik Lucatero booked a Computer Science meeting',
    html: renderToStaticMarkup(<Mail />),
  });
  res.status(200).end('Email Sent');
}
