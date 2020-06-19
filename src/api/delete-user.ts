export type DeleteUserResponse = ApiError;

export default async function deleteUser(
  req: NextApiRequest,
  res: NextApiResponse<DeleteUserResponse>
): Promise<void> {}
