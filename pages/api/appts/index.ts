import { NextApiRequest, NextApiResponse } from 'next';
import { ApiError } from 'lib/model';
import createAppt, { CreateApptRes } from 'lib/api/create-appt';
import listAppts, { ListApptsRes } from 'lib/api/list-appts';

/**
 * GET - Lists the user's, their children's, or their org's appointments.
 * POST - Creates a new appointment.
 *
 * Requires a JWT owned by an appointment attendee, their parents, or their org
 * admin.
 */
export default async function appts(
  req: NextApiRequest,
  res: NextApiResponse<ListApptsRes | CreateApptRes | ApiError>
): Promise<void> {
  switch (req.method) {
    case 'GET': // List the user's, their children's, or their org's appts.
      await listAppts(req, res);
      break;
    case 'POST': // Create a new appt.
      await createAppt(req, res);
      break;
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method as string} Not Allowed`);
  }
}
