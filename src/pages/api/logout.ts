import { NextApiRequest, NextApiResponse } from 'next';

export default function logout(
  req: NextApiRequest,
  res: NextApiResponse<void>
): void {
  req.session.decodedToken = null;
  res.status(200);
}
