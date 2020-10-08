import { NextApiRequest, NextApiResponse } from 'next';

export type DeleteUserResponse = void;

export default async function deleteUser(
  req: NextApiRequest,
  res: NextApiResponse<DeleteUserResponse>
): Promise<void> {}
