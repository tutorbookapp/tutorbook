import { NextApiRequest, NextApiResponse } from 'next';
import { ApiError } from '@tutorbook/model';
import createAppt, { CreateApptRes } from '@tutorbook/api/create-appt';

/**
 * POST - Creates a new appointment.
 *
 * Requires a JWT owned by the parents of one of the tutee or mentee attendees.
 */
export default async function appts(
  req: NextApiRequest,
  res: NextApiResponse<CreateApptRes | ApiError>
): Promise<void> {
  switch (req.method) {
    case 'POST': // Create a new request.
      await createAppt(req, res);
      break;
    default:
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${req.method as string} Not Allowed`);
  }
}
