import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import {
  RequestJSON,
  RequestsQuery,
  RequestsQueryJSON,
  isRequestsQueryJSON,
} from 'lib/model';
import { handle } from 'lib/api/error';
import getRequests from 'lib/api/get/requests';
import verifyAuth from 'lib/api/verify/auth';
import verifyBody from 'lib/api/verify/body';

export interface ListRequestsRes {
  requests: RequestJSON[];
  hits: number;
}

// TODO: Reduce code duplication and boilerplate definitions (e.g. this file is
// practically identical to the `listMatches` endpoint logic).
export default async function listRequests(
  req: Req,
  res: Res<ListRequestsRes>
): Promise<void> {
  try {
    const query = verifyBody<RequestsQuery, RequestsQueryJSON>(
      req.query,
      isRequestsQueryJSON,
      RequestsQuery
    );
    const { requests, hits } = await getRequests(query);
    await verifyAuth(req.headers, { orgIds: query.orgs.map((o) => o.value) });
    res.status(200).json({ hits, requests: requests.map((r) => r.toJSON()) });
  } catch (e) {
    handle(e, res);
  }
}
