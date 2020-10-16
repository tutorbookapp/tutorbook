import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import {
  RequestJSON,
  RequestsQuery,
  RequestsQueryURL,
  isRequestsQueryURL,
} from 'lib/model';
import { handle } from 'lib/api/error';
import getRequests from 'lib/api/get/requests';
import verifyAuth from 'lib/api/verify/auth';
import verifyQuery from 'lib/api/verify/query';

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
    const query = verifyQuery<RequestsQuery, RequestsQueryURL>(
      req.query,
      isRequestsQueryURL,
      RequestsQuery
    );
    // TODO: Rewrite the `RequestsQuery` class such that it only specifies a
    // single `org` instead of multiple (like the `api/matches` endpoint).
    await verifyAuth(req.headers, { orgIds: query.orgs.map((o) => o.value) });
    const { requests, hits } = await getRequests(query);
    res.status(200).json({ hits, requests: requests.map((r) => r.toJSON()) });
  } catch (e) {
    handle(e, res);
  }
}
